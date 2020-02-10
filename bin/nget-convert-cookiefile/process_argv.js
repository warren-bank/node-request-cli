const process_argv = require('@warren-bank/node-process-argv')

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
