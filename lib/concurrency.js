// -------------------------------------------------------------------
// prepare the requests:

const fp_helper = require('./filepath_helper')
const proxy     = require('./proxy')

const {request} = require('@warren-bank/node-request')

const fs        = require('fs')
const parse_url = require('url').parse

const get_url_ranges = async (argv_vals, urldata, options, config) => {
  if (argv_vals["--dry-run"] || argv_vals["--recursive"])
    return null

  if ((['GET','POST']).indexOf(argv_vals["--method"]) === -1)
    return null

  try {
    const _url = Array.isArray(urldata) ? urldata[0] : urldata
    const _options = Object.assign(
      {},
      options,
      parse_url(_url),
      {method: 'HEAD'}
    )
    proxy.addProxyAgent(argv_vals, _options)
    const _config = {...config}
    const {url, redirects, response} = await request(_options, argv_vals["--post-data"], _config)

    if (!response || !response.headers || !response.headers['content-length'])
      throw ''

    if (url && argv_vals["--server-response"]) {
      console.log('url:', url)
      if (response.statusCode)
        console.log('status code:', response.statusCode)
      if (Array.isArray(redirects) && redirects.length)
        console.log('redirects:', JSON.stringify(redirects, null, 2))
      if (response.headers)
        console.log('headers:', JSON.stringify(response.headers, null, 2))
    }

    let total_size
    total_size = response.headers['content-length']
    total_size = parseInt(total_size, 10)

    if (!total_size || isNaN(total_size) || (total_size <= 0))
      throw ''

    let chunk_size
    if (argv_vals["--chunk-size"]) {
      // convert from MBs to bytes
      chunk_size = argv_vals["--chunk-size"] * 1000000
    }
    if (!chunk_size || (chunk_size <= 0)) {
      chunk_size = Math.ceil( total_size / argv_vals["--max-concurrency"] )
    }

    const output_filepath = fp_helper.get_output_filepath(argv_vals, urldata, {url, redirects, response})

    if (!output_filepath || (output_filepath === "-"))
      throw ''

    if (fs.existsSync(output_filepath)) {
      if (argv_vals["--no-clobber"] || argv_vals["--continue"])
        throw ''
      else
        fs.unlinkSync(output_filepath)
    }

    const file_descriptor = fs.openSync(output_filepath, 'w')

    if (!file_descriptor || !(typeof file_descriptor === 'number') || !(file_descriptor > 0))
      throw ''

    // stash the resolved output filepath in case an incomplete download will need to be deleted.
    // since every range URL will include a file descriptor, this field will no-longer be used.
    argv_vals["--output-document"] = output_filepath

    const new_urls = []
    let first_byte, last_byte, range_size, range, new_url, new_urldata

    last_byte  = 0
    range_size = chunk_size
    while (last_byte < total_size) {
      first_byte = last_byte
      last_byte += chunk_size

      if (last_byte > total_size) {
        last_byte  = total_size
        range_size = (last_byte - first_byte)
      }

      // -----------------------------------------
      // note:
      //   both index values are inclusive.
      //   this differs from how ranges are used in programming: (inclusive start index, exclusive end index)
      //   ex: string.substring(), array.slice(), etc.
      // -----------------------------------------
      range = `bytes=${first_byte}-${last_byte - 1}`

      new_url = Object.assign(
        {},
        parse_url(_url),
        {headers: {range}}
      )

      new_urldata = [new_url, file_descriptor, first_byte, range_size]

      new_urls.push(new_urldata)
    }

    return {new_urls, file_descriptor}
  }
  catch(e) {
    return null
  }
}

// -------------------------------------------------------------------
// process the responses:

const log = require('./logger')

const Buffer = require('buffer').Buffer

const range_data = []

const fd_locks = {}

const max_range_errors  = 10  // number of failed attempts to write to the output file with byte ranges before the whole operation is aborted
let range_error_counter = 0

const write_range_data = (argv_vals, response, urldata, resolve, reject) => {
  const [, file_descriptor, first_byte, range_size] = urldata

  if (!(response instanceof Buffer) || (response.length !== range_size)) {
    const err = 'Buffer for Range is incorrect length'
    log(`${err}\nexpected: ${range_size}.\nreceived: ${response.length}.`)

    reject(new Error(err))
    return
  }

  range_data.push({argv_vals, response, file_descriptor, first_byte, range_size, resolve, reject})

  write_to_fd()
}

const write_to_fd = () => {
  if (!range_data.length)
    return

  let data
  for (let i=0; i < range_data.length; i++) {
    let fd = range_data[i].file_descriptor
    let ok = !fd_locks[fd]

    if (ok) {
      fd_locks[fd] = true
      data = range_data[i]
      range_data.splice(i, 1)
    }
  }

  if (!data)
    return

  const {file_descriptor, first_byte, range_size, resolve} = data

  fs.write(file_descriptor, data.response, 0, range_size, first_byte, (error, bytesWritten) => {
    fd_locks[file_descriptor] = false

    if (error || (bytesWritten !== range_size)) {
      range_error_counter++

      if (range_error_counter < max_range_errors) {
        range_data.unshift(data)
      }
      else {
        const error_msg = `ERROR: Too many failed attempts to write to the output file.\n${max_range_errors} is the maximum allowed.\nAborting threaded download.`
        abort_operation(data.argv_vals, error_msg, file_descriptor)
      }
    }
    else {
      // garbage collect the Buffer
      data.response = null
      data          = null

      resolve()
    }

    write_to_fd()
  })
}

// -------------------------------------------------------------------

const abort_operation = (argv_vals, error_msg, file_descriptor) => {
  console.log(error_msg)

  try {
    if (file_descriptor) {
      fs.closeSync(file_descriptor)
    }
  }
  catch(e) {}

  try {
    const output_filepath = argv_vals["--output-document"]

    if (output_filepath && !process.env['keep_incomplete_download']) {
      fs.unlinkSync(output_filepath)
    }
  }
  catch(e) {}

  process.exit(1)
}

// -------------------------------------------------------------------

module.exports = {get_url_ranges, write_range_data, abort_operation}
