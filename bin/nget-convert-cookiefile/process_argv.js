const grep_argv = require('./grep_argv')

const path = require('path')
const fs   = require('fs')

const argv_flags = {
  "--help":                                 {bool: true},
  "--version":                              {bool: true},

  "--json-to-text":                         {bool: true},
  "--text-to-json":                         {bool: true},

  "--in":                                   {},
  "--out":                                  {}
}

const argv_flag_aliases = {
  "--help":                                 ["-h"],
  "--version":                              ["-V"]
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

if (!argv_vals["--json-to-text"] && !argv_vals["--text-to-json"]){
  console.log("ERROR: No conversion operations is enabled.")
  process.exit(0)
}

if (argv_vals["--json-to-text"] && argv_vals["--text-to-json"]){
  console.log("ERROR: Multiple conversion operations are enabled. Only enable one.")
  process.exit(0)
}

if (!argv_vals["--in"]){
  console.log("ERROR: Input filepath is not defined.")
  process.exit(0)
}

if (!argv_vals["--out"]){
  console.log("ERROR: Output filepath is not defined.")
  process.exit(0)
}

if (argv_vals["--in"]){
  argv_vals["--in"]  = path.resolve(argv_vals["--in"])

  if (! fs.existsSync(argv_vals["--in"])) {
    console.log('ERROR: Input filepath does not exist.')
    process.exit(0)
  }
}

if (argv_vals["--out"]){
  argv_vals["--out"] = path.resolve(argv_vals["--out"])

  let output_dir = path.dirname(argv_vals["--out"])

  if (! fs.existsSync(output_dir)) {
    console.log('ERROR: Output directory does not exist.')
    process.exit(0)
  }
}

module.exports = argv_vals
