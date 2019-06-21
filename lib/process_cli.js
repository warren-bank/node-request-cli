#! /usr/bin/env node

const get_filename   = require('./get_filename')

const {request}      = require('@warren-bank/node-request')
const {getCookieJar} = require('@warren-bank/node-request/lib/cookie_jar')

const parse_url      = require('url').parse
const path           = require('path')
const fs             = require('fs')

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
      .map(url => url.trim().split(/[\t]+/))                                  // Array<url, output_filepath>
      .filter(urldata => ((urldata[0].length) && (urldata[0][0] !== "#")))    // ignore empty lines, and lines that begin with "#"
  }
  if (argv_vals["--url"]) {
    urls.push(argv_vals["--url"])  // String<url>
  }

  // -----------------------------------------------------------------------------
  // download next URL; returns a Promise

  const download_next_url = function(){
      let urldata = urls.shift()
      let url     = Array.isArray(urldata) ? urldata[0] : urldata

      let _options = Object.assign(
        {},
        options,
        parse_url(url)
      )

      let _config = {...config}

      return request(_options, argv_vals["--post-data"], _config)
      .then(({url, redirects, response}) => {
        if (argv_vals["--server-response"]) {
          console.log(`url: ${url}\nheaders: ${JSON.stringify(response.headers, null, 2)}\n`)
        }

        let output_filepath
        if (!Array.isArray(urldata) && argv_vals["--output-document"]) {
          output_filepath = argv_vals["--output-document"]
        }
        else if (Array.isArray(urldata) && (urldata.length >= 2)) {
          output_filepath = urldata[1]
        }
        else {
          let header      = argv_vals["--content-disposition"] ? response.headers['content-disposition'] : ''
          output_filepath = get_filename(header, url)
        }

        if (!path.isAbsolute(output_filepath)) {
          let output_dir  = argv_vals["--directory-prefix"] || process.cwd()
          output_filepath = path.resolve(output_dir, output_filepath)
        }

        if (fs.existsSync(output_filepath)) {
          if (argv_vals["--no-clobber"]) {
            return
          }
          else {
            // "--continue" is not supported
            fs.unlinkSync(output_filepath)
          }
        }

        {
          let output_dirpath = path.dirname(output_filepath)

          if (!fs.existsSync(output_dirpath)) {
            fs.mkdirSync(output_dirpath, {recursive: true})  // "recursive" option requires Node v10.12.0+
          }
        }

        return new Promise((resolve, reject) => {
          const stream = fs.createWriteStream(output_filepath)

          if (argv_vals["--save-headers"]) {
            stream.write(`${JSON.stringify(response.headers, null, 2)}\n\n`)
          }

          response
          .pipe(stream)
          .on('finish', () => {
            resolve()
          })
          .on('error', (error) => {
            response.destroy()
            reject(error)
          })
        })
      })
      .catch((error) => {
        console.log(`url: ${url}\nerror: ${error.message}\n`)
      })
  }

  // -----------------------------------------------------------------------------
  // download URLs sequentially

  const process_download_queue_sequentially = async function(){
    while(urls.length){
      await download_next_url()
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

    download_next_url()
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
    return new Promise((resolve, reject) => {
      process_download_queue_concurrently(resolve)
    })
  }
  else {
    return process_download_queue_sequentially()
  }
}

// -----------------------------------------------------------------------------

module.exports = {request, download: process_cli}
