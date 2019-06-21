#! /usr/bin/env node

const argv_vals  = require('./nget/process_argv')
const {download} = require('../lib/process_cli')

download(argv_vals)
.catch((error) => {
})
.then(() => {
  process.exit(0)
})
