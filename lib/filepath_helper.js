const fs        = require('fs')
const path      = require('path')
const parse_url = require('url').parse

const regex = {
  charsets: {
    windows: /([\\\|\/\:\?"\*\<\>])/g,   // ‘\’, ‘|’, ‘/’, ‘:’, ‘?’, ‘"’, ‘*’, ‘<’, ‘>’
    unix:    /([\/])/g,                  // ‘/’
    control: /([\x00-\x1F\x80-\x9F])/g,  // 0–31 and 128–159
    ascii:   /([\x80-\xFF])/g            // 128-255
  },
  content_disposition_header: {
    quoted_filename:   /filename=(['"])([^\1]+)\1/i,
    unquoted_filename: /filename=([^\s]+)(?:[\s]|$)/i
  }
}

const reset_global_regex = (r) => {
  if (r instanceof RegExp) {
    r.lastIndex = 0
  }
  return r
}

// -----------------------------------------------------------------------------

const get_output_filepath = (argv_vals, urldata, {url, redirects, response, is_html} = {}) => {
  let request_url, output_filepath

  if (!request_url && url) {
    request_url = (Array.isArray(redirects) && redirects.length && argv_vals["--trust-server-names"])
      ? redirects[redirects.length - 1]
      : url
  }

  if (!request_url && urldata) {
    request_url = Array.isArray(urldata)
      ? urldata[0]
      : urldata
  }

  if (!output_filepath && Array.isArray(urldata) && (urldata.length >= 2)) {
    output_filepath = urldata[1]
  }

  if (!output_filepath && argv_vals["--output-document"] && (!Array.isArray(urldata) || (argv_vals["--output-document"] === "-"))) {
    output_filepath = argv_vals["--output-document"]
  }

  if (!output_filepath && argv_vals["--recursive"] && request_url) {
    const dirs = []
    const parsed_url = parse_url(request_url)

    if (!argv_vals["--no-directories"] && argv_vals["--protocol-directories"] && parsed_url.protocol) {
      let dir = parsed_url.protocol
      if (dir[dir.length - 1] === ':') {
        dir = dir.substring(0, dir.length - 1)
      }
      dirs.push(dir)
    }
    if (!argv_vals["--no-directories"] && !argv_vals["--no-host-directories"] && parsed_url.hostname) {
      let dir = parsed_url.hostname
      if (parsed_url.port) {
        dir += (argv_vals["--restrict-file-names"].indexOf("windows") >= 0)
          ? '+'
          : ':'
        dir += parsed_url.port
      }
      dirs.push(dir)
    }
    if (parsed_url.pathname) {
      let parts = parsed_url.pathname.split('/')
      let fname = parts.pop() || argv_vals["--default-page"] || 'index.html'

      if (!argv_vals["--no-directories"]) {
        parts = parts.filter(part => !!part)

        if (argv_vals["--cut-dirs"]) {
          parts = (argv_vals["--cut-dirs"] < parts.length)
            ? parts.slice(argv_vals["--cut-dirs"])
            : []
        }

        if (parts.length) {
          dirs.push(...parts)
        }
      }

      if (parsed_url.query && !argv_vals["--no-querystring"]) {
        fname += (argv_vals["--restrict-file-names"].indexOf("windows") >= 0)
          ? '@'
          : '?'
        fname += parsed_url.query
      }

      fname = escape_filename(argv_vals, fname, is_html)
      dirs.push(fname)
    }

    if (dirs.length) {
      output_filepath = dirs.join(path.sep)
    }
  }

  if (!output_filepath && argv_vals["--content-disposition"] && (response instanceof Object) && (response.headers instanceof Object) && response.headers['content-disposition']) {
    output_filepath = extract_filename_header(response.headers['content-disposition'])
  }

  if (!output_filepath && request_url && (!argv_vals["--content-disposition"] || (argv_vals["--content-disposition"] && (response instanceof Object)))) {
    const parsed_url = parse_url(request_url)

    if (parsed_url.pathname) {
      const parts = parsed_url.pathname.split('/')
      const fname = parts.pop()

      if (fname) {
        if (parsed_url.query && !argv_vals["--no-querystring"]) {
          fname += (argv_vals["--restrict-file-names"].indexOf("windows") >= 0)
            ? '@'
            : '?'
          fname += parsed_url.query
        }

        output_filepath = escape_filename(argv_vals, fname)
      }
    }

    // fallback
    if (!output_filepath) {
      output_filepath = get_hash(request_url)
    }
  }

  if (output_filepath && (output_filepath !== "-") && !path.isAbsolute(output_filepath)) {
    const output_dir = argv_vals["--directory-prefix"] || process.cwd()
    output_filepath  = path.resolve(output_dir, output_filepath)
  }

  return output_filepath
}

// -----------------------------------------------------------------------------

const escape_filename = (argv_vals, fname, is_html) => {
  if (fname && (typeof fname === 'string')) {
    if (argv_vals["--adjust-extension"] && is_html && ((fname.length < 5) || (fname.substring(fname.length - 5, fname.length).toLowerCase() !== '.html'))) {
      fname += '.html'
    }
    if (argv_vals["--restrict-file-names"].indexOf("windows") >= 0) {
      fname = fname.replace(reset_global_regex(regex.charsets.windows), escape_ascii_character)
    }
    if (argv_vals["--restrict-file-names"].indexOf("unix") >= 0) {
      fname = fname.replace(reset_global_regex(regex.charsets.unix), escape_ascii_character)
    }
    if (argv_vals["--restrict-file-names"].indexOf("nocontrol") === -1) {
      fname = fname.replace(reset_global_regex(regex.charsets.control), escape_ascii_character)
    }
    if (argv_vals["--restrict-file-names"].indexOf("ascii") >= 0) {
      fname = fname.replace(reset_global_regex(regex.charsets.ascii), escape_ascii_character)
    }
    if (argv_vals["--restrict-file-names"].indexOf("lowercase") >= 0) {
      fname = fname.toLowerCase()
    }
    if (argv_vals["--restrict-file-names"].indexOf("uppercase") >= 0) {
      fname = fname.toUpperCase()
    }
    if ((argv_vals["--plugins"] instanceof Object) && (argv_vals["--plugins"]["change_filename"] instanceof Function)) {
      fname = argv_vals["--plugins"]["change_filename"](fname) || fname
    }
  }
  return fname
}

const escape_ascii_character = (c) => {
  return '%' + c.charCodeAt(0).toString(16).toUpperCase()
}

// -----------------------------------------------------------------------------

const extract_filename_header = (header) => {
  if (header) {
    let match

    match = String(header).match(regex.content_disposition_header.quoted_filename)
    if (match && (match.length >= 3)) return match[2]

    match = String(header).match(regex.content_disposition_header.unquoted_filename)
    if (match && (match.length >= 2)) return match[1]
  }
  return null
}

// -----------------------------------------------------------------------------

const get_hash = (data, algorithm='sha256') => {
  const crypto = require('crypto')
  const hash   = crypto.createHash(algorithm)
  hash.update(data)
  return hash.digest('hex')
}

// -----------------------------------------------------------------------------

const make_parent_directory = (output_filepath) => {
  const output_dirpath = path.dirname(output_filepath)

  if (!fs.existsSync(output_dirpath)) {
    fs.mkdirSync(output_dirpath, {recursive: true})  // "recursive" option requires Node v10.12.0+
  }
}

// -----------------------------------------------------------------------------

module.exports = {get_output_filepath, make_parent_directory}
