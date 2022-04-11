const HttpProxyAgent  = require('http-proxy-agent')
const HttpsProxyAgent = require('https-proxy-agent')
const SocksProxyAgent = require('socks-proxy-agent')

const parse_url = require('url').parse

const add_argv_flags = (argv_flags) => {
  Object.assign(
    argv_flags,
    {
      "--no-proxy":    {bool: true},
      "--proxy":       {},
      "--proxy-http":  {},
      "--proxy-https": {}
    }
  )
}

const add_argv_flag_aliases = (argv_flag_aliases) => {
  Object.assign(
    argv_flag_aliases,
    {
      "--proxy":       ["-x"]
    }
  )
}

const process_argv_vals = (argv_vals) => {
  if (argv_vals["--no-proxy"] || (argv_vals["--proxy"] === '')) {
    argv_vals["--proxy-http"]  = null
    argv_vals["--proxy-https"] = null
  }
  else {
    argv_vals["--proxy-http"]  = argv_vals["--proxy-http"]  || argv_vals["--proxy"] || process.env['http_proxy']  || process.env['proxy']
    argv_vals["--proxy-https"] = argv_vals["--proxy-https"] || argv_vals["--proxy"] || process.env['https_proxy'] || process.env['proxy']
  }

  argv_vals["--no-proxy"] = null
  argv_vals["--proxy"]    = null

  convert_to_proxy_agents(argv_vals)
}

const convert_to_proxy_agents = (argv_vals) => {
  const cache = {}

  argv_vals["--proxy-http"]  = convert_to_proxy_agent(cache, false, argv_vals["--proxy-http"])
  argv_vals["--proxy-https"] = convert_to_proxy_agent(cache, true,  argv_vals["--proxy-https"])
}

const convert_to_proxy_agent = (cache, secureEndpoint, url) => {
  if (!url)       return null
  if (cache[url]) return cache[url]

  try {
    const parsed_url = parse_url(url)

    if (!parsed_url.hostname && !parsed_url.host)
      throw false

    if (parsed_url.auth)
      parsed_url.auth = decodeURIComponent(parsed_url.auth)

    let protocol
    protocol = parsed_url.protocol || 'http'
    protocol = protocol.toLowerCase()
    if (':' === protocol[protocol.length - 1])
      protocol = protocol.substring(0, protocol.length - 1)

    switch(protocol) {
      case 'http':
      case 'https':
        return secureEndpoint
          ? new HttpsProxyAgent(parsed_url)
          : new HttpProxyAgent( parsed_url)

      case 'socks':
      case 'socks4':
      case 'socks4a':
      case 'socks5':
      case 'socks5h':
        const agent = new SocksProxyAgent(parsed_url)
        cache[url]  = agent
        return agent

      default:
        throw 'ERROR: Proxy URL uses an unsupported protocol'
    }
  }
  catch(e) {
    const message = (typeof e === 'string')
      ? e
      : 'ERROR: Proxy URL in invalid'

    console.log(message)
    console.log(url)
    process.exit(0)
  }
}

module.exports = {
  add_argv_flags,
  add_argv_flag_aliases,
  process_argv_vals
}
