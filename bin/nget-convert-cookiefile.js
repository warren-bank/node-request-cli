#! /usr/bin/env node

const argv_vals = require('./nget-convert-cookiefile/process_argv')

const {convert_JSON_to_NS, convert_NS_to_JSON} = require('@warren-bank/node-request/lib/cookie_jar_converter')

if (argv_vals["--json-to-text"]){
  let input_filepath_JSON = argv_vals["--in"]
  let output_filepath_NS  = argv_vals["--out"]

  convert_JSON_to_NS(input_filepath_JSON, output_filepath_NS)
}

if (argv_vals["--text-to-json"]){
  let input_filepath_NS    = argv_vals["--in"]
  let output_filepath_JSON = argv_vals["--out"]

  convert_NS_to_JSON(input_filepath_NS, output_filepath_JSON)
}
