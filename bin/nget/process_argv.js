const process_argv = require('@warren-bank/node-process-argv')

const path = require('path')
const fs   = require('fs')

const process_post_data = require('./process_argv/process_post_data')

const curl        = require('./process_argv/curl')
const proxy       = require('./process_argv/proxy')
const web_crawler = require('./process_argv/web_crawler')
const addons      = [curl, proxy, web_crawler]

const argv_flags = {
  "--help":                                 {bool: true},
  "--version":                              {bool: true},

  "--url":                                  {},
  "--input-file":                           {file: "lines"},
  "--max-concurrency":                      {num:  "int"},
  "--wait":                                 {num:  "int"},
  "--random-wait":                          {bool: true},

  "--headers":                              {file: "json"},
  "--referer":                              {},
  "--user-agent":                           {},
  "--header":                               {many: true},

  "--method":                               {enum: ["GET","HEAD","POST","PUT","DELETE","CONNECT","OPTIONS","TRACE","PATCH"]},

  "--post-data":                            {},
  "--post-file":                            {file: "stream"},

  "--max-redirect":                         {num:  "int"},
//"--binary":                               {bool: true},
//"--stream":                               {bool: true},
  "--no-check-certificate":                 {bool: true},
  "--no-follow-redirect":                   {bool: true},
  "--no-validate-status-code":              {bool: true},

  "--load-cookies":                         {},
  "--no-cookies":                           {bool: true},

  "--directory-prefix":                     {},
  "--default-page":                         {},
  "--output-document":                      {},
  "--content-disposition":                  {bool: true},
  "--trust-server-names":                   {bool: true},
  "--no-querystring":                       {bool: true},
  "--restrict-file-names":                  {enum: ["windows","unix","nocontrol","ascii","lowercase","uppercase"], many: true},
  "--no-clobber":                           {bool: true},
  "--continue":                             {bool: true},

  "--server-response":                      {bool: true},
  "--dry-run":                              {bool: true},
  "--save-headers":                         {bool: true},

  "--plugins":                              {file: "module"}
}

const argv_flag_aliases = {
  "--help":                                 ["-h"],
  "--version":                              ["-V"],
  "--url":                                  ["-u"],
  "--input-file":                           ["-i"],
  "--max-concurrency":                      ["--mc", "--threads"],
  "--wait":                                 ["-w"],
  "--user-agent":                           ["-U"],
  "--directory-prefix":                     ["-P"],
  "--output-document":                      ["-O"],
  "--no-querystring":                       ["-nQ"],
  "--no-clobber":                           ["-nc"],
  "--continue":                             ["-c"],
  "--server-response":                      ["-S"],
  "--dry-run":                              ["-dr"]
}

for (const addon of addons) {
  addon.add_argv_flags(argv_flags)
  addon.add_argv_flag_aliases(argv_flag_aliases)
}

let argv_vals = {}

try {
  argv_vals = process_argv(argv_flags, argv_flag_aliases)
}
catch(e) {
  console.log('ERROR: ' + e.message)
  process.exit(1)
}

if (argv_vals["--help"]) {
  const help = require('./help')
  console.log(help)
  process.exit(0)
}

if (argv_vals["--version"]) {
  const data = require('../../package.json')
  console.log(data.version)
  process.exit(0)
}

if (!argv_vals["--url"] && (!argv_vals["--input-file"] || !argv_vals["--input-file"].length)) {
  console.log('ERROR: URL is required')
  process.exit(0)
}

if (argv_vals["--referer"] || argv_vals["--user-agent"] || argv_vals["--header"].length) {
  argv_vals["--headers"] = argv_vals["--headers"] || {}

  if (argv_vals["--referer"]) {
    argv_vals["--headers"]["referer"] = argv_vals["--referer"]
  }
  if (argv_vals["--user-agent"]) {
    argv_vals["--headers"]["user-agent"] = argv_vals["--user-agent"]
  }
  if (argv_vals["--header"].length) {
    let split = function(str, sep) {
      let chunks, start

      chunks = str.split(sep, 2)
      if (chunks.length !== 2) return chunks

      start = chunks[0].length
      start = chunks[1] ? str.indexOf(chunks[1], start) : -1

      if (start === -1)
        delete chunks[1]
      else
        chunks[1] = str.substr(start)

      return chunks
    }

    argv_vals["--header"].forEach((header) => {
      let parts = split(header, /\s*[:=]\s*/g)
      let key, val

      if (parts.length === 2) {
        key = parts[0].toLowerCase()
        val = parts[1]
        argv_vals["--headers"][key] = val
      }
    })
  }
}

argv_vals["--post-data"] = (
     process_post_data(argv_vals["--post-data"], (argv_vals["--headers"] ? argv_vals["--headers"]['content-type'] : null))
  || argv_vals["--post-data"]
  || argv_vals["--post-file"]
  || ""
)

delete argv_vals["--post-file"]

argv_vals["--method"] = (
     argv_vals["--method"]
  || (
       argv_vals["--post-data"]
         ? "POST"
         : "GET"
     )
)

// =============================================================================
// references:
// =============================================================================
//   https://nodejs.org/api/cli.html#cli_environment_variables
//   https://nodejs.org/api/cli.html#cli_node_tls_reject_unauthorized_value
// =============================================================================
if (argv_vals["--no-check-certificate"]) {
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0
}

if (argv_vals["--no-cookies"]) {
  argv_vals["--load-cookies"] = ""
}

if (argv_vals["--load-cookies"]) {
  if (argv_vals["--load-cookies"].toLowerCase() === 'true') {
    argv_vals["--load-cookies"] = true
  }
  else {
    argv_vals["--load-cookies"] = path.resolve(argv_vals["--load-cookies"])

    let output_dir = path.dirname(argv_vals["--load-cookies"])

    if (! fs.existsSync(output_dir)) {
      console.log('ERROR: Cookie jar directory does not exist')
      process.exit(0)
    }
  }
}

if (argv_vals["--directory-prefix"]) {
  argv_vals["--directory-prefix"] = path.resolve(argv_vals["--directory-prefix"])

  if (! fs.existsSync(argv_vals["--directory-prefix"])) {
    console.log('ERROR: Output directory does not exist')
    process.exit(0)
  }
}

if (argv_vals["--output-document"] && ((["/dev/null", "nul"]).indexOf(argv_vals["--output-document"].toLowerCase()) >= 0)) {
  argv_vals["--output-document"] = "-"
  argv_vals["--dry-run"]         = true
}

if (argv_vals["--output-document"] && (argv_vals["--output-document"] !== "-")) {
  argv_vals["--output-document"] = path.resolve(argv_vals["--output-document"])

  let output_dir = path.dirname(argv_vals["--output-document"])

  if (! fs.existsSync(output_dir)) {
    console.log('ERROR: Output directory does not exist')
    process.exit(0)
  }

  if (fs.existsSync(argv_vals["--output-document"])) {
    if (argv_vals["--no-clobber"]) {
      console.log('ERROR: Output file already exists')
      process.exit(0)
    }
    if (!argv_vals["--continue"]) {
      fs.unlinkSync(argv_vals["--output-document"])
    }
  }
}

if (!argv_vals["--restrict-file-names"].length) {
  argv_vals["--restrict-file-names"].push(
    (process.platform === 'win32')
      ? 'windows'
      : 'unix'
  )
}

if (argv_vals["--head"]) {
  argv_vals["--spider"]    = false
  argv_vals["--mirror"]    = false
  argv_vals["--recursive"] = false
}

for (const addon of addons) {
  addon.process_argv_vals(argv_vals)
}

module.exports = argv_vals
