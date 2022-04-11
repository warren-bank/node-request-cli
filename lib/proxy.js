const addProxyAgent = (argv_vals, options) => {
  if ((options instanceof Object) && options.protocol) {
    const is_http  = (options.protocol.toLowerCase() === 'http:')
    const is_https = (options.protocol.toLowerCase() === 'https:')

    if (is_http && argv_vals["--proxy-http"])
      options.agent = argv_vals["--proxy-http"]

    if (is_https && argv_vals["--proxy-https"])
      options.agent = argv_vals["--proxy-https"]
  }
}

module.exports = {addProxyAgent}
