const concurrency    = require('./concurrency')
const fp_helper      = require('./filepath_helper')
const proxy          = require('./proxy')
const web_crawler    = require('./web_crawler')

const {request}      = require('@warren-bank/node-request')
const {getCookieJar} = require('@warren-bank/node-request/lib/cookie_jar')

const fs             = require('fs')
const stream         = require('stream')
const parse_url      = require('url').parse

// returns a Promise that resolves after all downloads are complete.
const process_cli = function(argv_vals){
  const options = {
    headers: argv_vals["--headers"],
    method:  argv_vals["--method"]
  }

  const config = {
    followRedirect: (! argv_vals["--no-follow-redirect"]),
    maxRedirects:   (  argv_vals["--max-redirect"] || 10),
    binary:         true,
    stream:         true
  }

  if (argv_vals["--no-validate-status-code"]) {
    config.validate_status_code = false
  }

  if (argv_vals["--load-cookies"]) {
    config.cookieJar = getCookieJar(argv_vals["--load-cookies"])
  }

  let urls = []
  if (argv_vals["--input-file"] && argv_vals["--input-file"].length) {
    urls = argv_vals["--input-file"]
      .map(url => url.trim().split(/[\t]+/, 2))                               // Array<url, output_filepath> from first 2x tab separated columns; additional columns are ignored
      .filter(urldata => ((urldata[0].length) && (urldata[0][0] !== "#")))    // ignore empty lines, and lines that begin with "#"
  }
  if (argv_vals["--url"]) {
    urls.push(argv_vals["--url"])  // String<url>
  }

  const max_range_errors  = (argv_vals["--max-concurrency"] || 0) * 3
  let range_error_counter = 0

  // -----------------------------------------------------------------------------
  // download next URL; returns a Promise

  const download_next_url = function(is_concurrent){
      const urldata = urls.shift()
      const _url    = Array.isArray(urldata) ? urldata[0] : urldata

      const _options = Object.assign(
        {},
        options,
        ((typeof _url === 'string') ? parse_url(_url) : {}),
        ((_url instanceof Object)   ? _url            : {})  // includes 'range' header
      )

      proxy.addProxyAgent(argv_vals, _options)

      const _config = {...config}

      let output_filepath = fp_helper.get_output_filepath(argv_vals, urldata)

      const is_range = output_filepath && (typeof output_filepath === 'number') && (output_filepath > 0)  // file descriptor

      if (is_range) {
        // "response" is a Buffer
        _config.stream = false
      }

      if (!is_range && output_filepath && (output_filepath !== "-")) {
        if (fs.existsSync(output_filepath)) {
          if (argv_vals["--no-clobber"]) {
            // short-circuit HTTP request
            return Promise.resolve()
          }
          if (argv_vals["--continue"]) {
            // add 'Range' header to request
            const stats = fs.statSync(output_filepath, {throwIfNoEntry: false})
            if (stats && stats.isFile() && stats.size) {
              _options.headers = options.headers ? {...options.headers} : {}
              _options.headers['range'] = `bytes=${stats.size}-`
            }
          }
        }
      }

      return request(_options, argv_vals["--post-data"], _config)
      .then(data => {
        // reset options that should only apply to the first request in a batch of downloads (ex: "--input-file" or "--recursive")
        if (!is_range && argv_vals["--post-data"]) {
          argv_vals["--post-data"] = null
          options.method           = null
        }
        return data
      })
      .then(({url, redirects, response} = {}) => {
        return web_crawler.apply_crawler_middleware(argv_vals, urls, {url, redirects, response, urldata})
      })
      .then(({url, redirects, response, new_output_filepath} = {}) => {
        if (new_output_filepath) {
          output_filepath = new_output_filepath
        }

        let abort = false

        if (url && argv_vals["--server-response"]) {
          console.log('url:', url)
          if (response.statusCode)
            console.log('status code:', response.statusCode)
          if (Array.isArray(redirects) && redirects.length)
            console.log('redirects:', JSON.stringify(redirects, null, 2))
          if (response.headers)
            console.log('headers:', JSON.stringify(response.headers, null, 2))
        }

        if (argv_vals["--dry-run"]) {
          abort = true
        }

        if (!abort && !output_filepath) {
          output_filepath = fp_helper.get_output_filepath(argv_vals, urldata, {url, redirects, response})

          if (!output_filepath) {
            abort = true
          }
        }

        if (!abort && !is_range && (output_filepath !== "-")) {
          if (fs.existsSync(output_filepath)) {
            if (argv_vals["--no-clobber"]) {
              abort = true
            }
            if (argv_vals["--continue"] && _options.headers['range'] && (response.statusCode !== 206)) {
              console.log(`url: ${url}\nfile: ${output_filepath}\nerror:\n  File is incomplete.\n  Request to --continue does not return partial content.\n`)
              abort = true
            }
          }
        }

        if (abort) {
          if (response instanceof stream.Readable) {
            response.destroy()
          }
          return
        }

        if (!is_range && (output_filepath !== "-")) {
          fp_helper.make_parent_directory(output_filepath)
        }

        return new Promise((resolve, reject) => {
          if (!is_range) {
            const output_stream = (output_filepath !== "-")
              ? fs.createWriteStream(output_filepath, {flags: (argv_vals["--continue"] ? 'a' : 'w')})
              : process.stdout

            if (response.headers && argv_vals["--save-headers"]) {
              output_stream.write(`${JSON.stringify(response.headers, null, 2)}\n\n`)
            }

            if (response instanceof stream.Readable) {
              response
              .pipe(output_stream)
              .on('finish', () => {
                resolve()
              })
              .on('error', (error) => {
                response.destroy()
                reject(error)
              })
            }
            else {
              // "response" is a utf8-encoded String

              output_stream.write(response.toString(), 'utf8', () => {
                // wait until data written to the output stream has been flushed to the file system

                output_stream.end()
                resolve()
              })
            }
          }
          else {
            // "response" is a Buffer

            concurrency.write_range_data(response, urldata, resolve, reject)
          }
        })
      })
      .then(() => {
        return (argv_vals["--wait"] && urls.length && !is_concurrent)
          ? new Promise((resolve, reject) => {
              let delay_ms = argv_vals["--wait"] * 1000

              if (argv_vals["--random-wait"]) {
                delay_ms = Math.floor(delay_ms * get_random_float_within_range(0.5, 1.5))
              }

              setTimeout(resolve, delay_ms)
            })
          : true
      })
      .catch((error) => {
        if (!is_range) {
          console.log(`url: ${_url}\n${error.statusCode ? `status code: ${error.statusCode}\n` : ''}${error.location ? `location: ${error.location}\n` : ''}error: ${error.message}\n`)
        }
        else {
          range_error_counter++

          if (range_error_counter < max_range_errors) {
            urls.unshift(urldata)
          }
          else {
            urls = []
            console.log(`ERROR: Server responded to ${max_range_errors} range requests with bad status codes.\nAborting threaded download.`)
            process.exit(0)
          }
        }
      })
  }

  const get_random_float_within_range = (min, max) => Math.random() * (max - min) + min

  // -----------------------------------------------------------------------------
  // download URLs sequentially

  const process_download_queue_sequentially = async function(){
    while(urls.length){
      await download_next_url(false)
    }
  }

  // -----------------------------------------------------------------------------
  // download URLs concurrently

  let active_download_count = 0

  const process_download_queue_concurrently = function(cb){
    if (active_download_count >= argv_vals["--max-concurrency"])
      return

    if (!urls.length && !active_download_count)
      return cb()

    if (!urls.length)
      return

    active_download_count++

    download_next_url(true)
    .then(() => {
      active_download_count--
      process_download_queue_concurrently(cb)
    })

    if (active_download_count < argv_vals["--max-concurrency"])
      process_download_queue_concurrently(cb)
  }

  // -----------------------------------------------------------------------------
  // download URLs

  if (argv_vals["--max-concurrency"] && (argv_vals["--max-concurrency"] >= 2)) {
    return Promise.resolve()
    .then(() => {
      if (urls.length === 1) {
        return concurrency.get_url_ranges(argv_vals, urls[0], options, config)
      }
    })
    .then(({new_urls, file_descriptor} = {}) => {
      if (Array.isArray(new_urls) && new_urls.length) {
        urls = new_urls
      }

      return new Promise((resolve, reject) => {
        const cb = () => {
          if (file_descriptor) {
            fs.closeSync(file_descriptor)
          }
          resolve()
        }

        process_download_queue_concurrently(cb)
      })
    })
  }
  else {
    return process_download_queue_sequentially()
  }
}

// -----------------------------------------------------------------------------

module.exports = {request, download: process_cli}
