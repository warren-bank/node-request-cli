const grep_argv = require('./grep_argv')

const path = require('path')
const fs   = require('fs')

const argv_flags = {
  "--help":                                 {bool: true},
  "--version":                              {bool: true},

  "--url":                                  {},
  "--input-file":                           {file: "lines"},

  "--headers":                              {file: "json"},
  "--referer":                              {},
  "--user-agent":                           {},
  "--header":                               {many: true},

  "--method":                               {enum: ["GET","HEAD","POST","PUT","DELETE","CONNECT","OPTIONS","TRACE","PATCH"]},

  "--post-data":                            {},
  "--post-file":                            {file: true},

  "--max-redirect":                         {num:  true},
//"--binary":                               {bool: true},
//"--stream":                               {bool: true},
  "--no-follow-redirect":                   {bool: true},
  "--no-validate-status-code":              {bool: true},

  "--load-cookies":                         {},
  "--no-cookies":                           {bool: true},

  "--directory-prefix":                     {},
  "--output-document":                      {},
  "--content-disposition":                  {bool: true},
  "--no-clobber":                           {bool: true},

  "--save-headers":                         {bool: true},
  "--server-response":                      {bool: true}
}

const argv_flag_aliases = {
  "--help":                                 ["-h"],
  "--version":                              ["-V"],
  "--url":                                  ["-u"],
  "--input-file":                           ["-i"],
  "--user-agent":                           ["-U"],
  "--directory-prefix":                     ["-P"],
  "--output-document":                      ["-O"],
  "--no-clobber":                           ["-nc"],
  "--server-response":                      ["-S"]
}

const get_merged_argv_flags = function(){
  let argv_flags_merged = {...argv_flags}
  let key, flag_opts, aliases, alias

  for (key in argv_flag_aliases){
    flag_opts = argv_flags[key]
    aliases   = argv_flag_aliases[key]

    if ((flag_opts instanceof Object) && (Array.isArray(aliases))){
      for (alias of aliases){
        argv_flags_merged[alias] = flag_opts
      }
    }
  }

  return argv_flags_merged
}

const normalize_argv_vals = function(){
  if (!(argv_vals instanceof Object)) return

  let key, argv_val, aliases, alias

  for (key in argv_flag_aliases){
    argv_val = argv_vals[key]
    aliases  = argv_flag_aliases[key]

    if ((!argv_val) && (Array.isArray(aliases))){
      for (alias of aliases){
        argv_val = argv_vals[alias]
        if (argv_val) {
          argv_vals[key] = argv_val
          break
        }
      }
    }
  }
}

let argv_vals
try {
  argv_vals = grep_argv(get_merged_argv_flags(), true)

  normalize_argv_vals()
}
catch(e) {
  console.log('ERROR: ' + e.message)
  process.exit(0)
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
     argv_vals["--post-data"]
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

if (argv_vals["--output-document"]) {
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
    else {
      // "--continue" is not supported
      fs.unlinkSync(argv_vals["--output-document"])
    }
  }
}

module.exports = argv_vals
