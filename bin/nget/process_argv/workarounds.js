const add_argv_flags = (argv_flags) => {
}

const add_argv_flag_aliases = (argv_flag_aliases) => {
}

const process_argv_vals = (argv_vals) => {
  workaround_url_parse(argv_vals)
}

const workaround_url_parse = (argv_vals) => {
  // -----------------------------------------------------------------
  // https://github.com/nodejs/node-v0.x-archive/issues/8220
  //   summary:
  //     url.parse('$host/$path') does not work as expected
  //       {protocol: null, host: null, pathname: '$host/$path'}
  //     url.parse('$host:$port/$path') does not work as expected
  //       {protocol: '$host', host: '$port', pathname: '/$path'}
  // -----------------------------------------------------------------

  const keys = [
    '--url',
    '--referer',
    '--proxy',
    '--proxy-http',
    '--proxy-https',
    '--base'
  ]

  const regex = {
    good_protocol: new RegExp('^[^:/]+://.*$')
  }

  let url
  for (const key of keys) {
    url = argv_vals[key]
    if (url && !regex.good_protocol.test(url)) {
      url = (url.indexOf('//') === 0)
        ? ('http:'   + url)
        : ('http://' + url)

      argv_vals[key] = url
    }
  }
}

module.exports = {
  add_argv_flags,
  add_argv_flag_aliases,
  process_argv_vals
}
