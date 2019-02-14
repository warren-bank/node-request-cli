#! /usr/bin/env node

const argv_vals      = require('./nget/process_argv')
const get_filename   = require('./nget/get_filename')

const {request}      = require('@warren-bank/node-request')
const {getCookieJar} = require('@warren-bank/node-request/lib/cookie_jar')

const parse_url      = require('url').parse
const path           = require('path')
const fs             = require('fs')

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
  urls = argv_vals["--input-file"].map(url => url.trim())
}
if (argv_vals["--url"]) {
  urls.push(argv_vals["--url"])
}

// download URLs sequentially
const process_download_queue = async function(){
  while(urls.length){
    let url = urls.shift()

    let _options = Object.assign(
      {},
      options,
      parse_url(url)
    )

    let _config = {...config}

    await request(_options, argv_vals["--post-data"], _config)
    .then(({url, redirects, response}) => {
      if (argv_vals["--server-response"]) {
        console.log(`url: ${url}\nheaders: ${JSON.stringify(response.headers, null, 2)}\n`)
      }

      let output_filepath
      if (argv_vals["--output-document"]) {
        output_filepath = argv_vals["--output-document"]
      }
      else {
        let output_dir  = argv_vals["--directory-prefix"] || process.cwd()
        let header      = argv_vals["--content-disposition"] ? response.headers['content-disposition'] : ''
        let filename    = get_filename(header, url)

        output_filepath = path.resolve(output_dir, filename)
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
}

process_download_queue()
