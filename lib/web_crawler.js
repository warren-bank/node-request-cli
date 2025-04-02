const path        = require('path')
const parse_url   = require('url').parse
const resolve_url = require('url').resolve

const {normalize_hostname} = require('../bin/nget/process_argv/web_crawler')

const fp_helper = require('./filepath_helper')
const log       = require('./logger')

const regex = {
  content_types: {
    html: /^.*(?:text\/html|application\/xhtml\+xml).*$/,
    css:  /^.*(?:text\/css).*$/
  },
  html_content: {
    css: [
      [
        // ex: <style></style>
        /<style[^>]*>((?:.|[\r\n])*?)<\/style[^>]*>/ig,
        1
      ],
      [
        // ex: <tag style=''>
        // ex: <tag style="">
        /<[a-z]+\s[^>]*style=(['"])(.*?)(?<!\\)\1/ig,
        2
      ]
    ]
  },
  url_rules: {
    html: [
      [
        /(?:href|src)\s*=\s*(['"])(.*?)\1/ig,
        2
      ]
    ],
    css: [
      [
        // ex: @import 'http://example.com/style.css'
        // ex: @import "http://example.com/style.css"
        /@import\s*(['"])(.*?)\1/ig,
        2
      ],
      [
        // ex: url(http://example.com/image.jpg)
        // ex: url('http://example.com/image.jpg')
        // ex: url("http://example.com/image.jpg")
        // ex: url(&quot;http://example.com/image.jpg&quot;)
        // ====
        // note:
        //  * using `&quot;` as a delimiter is technically only valid for inline css
        //    ex: <tag style="background-image: url(&quot;http://example.com/image.jpg&quot;)">
        /url\s*\(\s*((?:['"]|&quot;)?)(.*?)\1\s*\)/ig,
        2
      ]
    ]
  }
}

const reset_global_regex = (r) => {
  if (r instanceof RegExp) {
    r.lastIndex = 0
  }
  return r
}

const get_normalized_hostname = (argv_vals, url) => {
  const parsed_url = parse_url(url)
  return normalize_hostname(argv_vals, parsed_url.hostname)
}

const get_normalized_pathname = (url) => {
  const parsed_url = parse_url(url)
  let pathname, parts

  pathname = parsed_url.pathname || '/'
  parts    = pathname.split('/')

  // remove [0]:    always empty
  // remove [last]: fname
  parts.shift()
  parts.pop()

  pathname = '/' + parts.join('/')

  return pathname
}

const apply_crawler_middleware = async (argv_vals, urls, {url, redirects, response, urldata}) => {
  let should_crawl = argv_vals["--recursive"]
  let follow_html  = true
  let current_depth, is_html, is_css

  if (should_crawl) {
    current_depth = (Array.isArray(urldata) && (urldata.length >= 3))
      ? urldata[2]
      : 0

    if (current_depth === 0) {
      const root_url = (Array.isArray(redirects) && redirects.length && argv_vals["--trust-server-names"])
        ? redirects[redirects.length - 1]
        : url

      // stash metadata for root URL of active crawl in current session
      argv_vals["--recursive/root"] = {
        hostname: get_normalized_hostname(argv_vals, root_url),
        pathname: get_normalized_pathname(root_url)
      }
    }

    if (!argv_vals["--page-requisites"] && (current_depth >= argv_vals["--level"])) {
      should_crawl = false
    }
  }

  if (should_crawl) {
    if (!is_html && (current_depth === 0)) {
      is_html = {force: true}
    }

    if (!is_html && should_force_html(argv_vals, url)) {
      is_html = {force: true}
    }

    if (!is_html && Array.isArray(redirects) && redirects.length && should_force_html(argv_vals, redirects[redirects.length - 1])) {
      is_html = {force: true}
    }

    if (!is_html && response.headers && response.headers['content-type']) {
      const content_type = response.headers['content-type'].toLowerCase()

      is_html = regex.content_types.html.test(content_type) ? {mime: true} : false
      is_css  = !is_html && regex.content_types.css.test(content_type)
    }

    if (!is_html && !is_css) {
      should_crawl = false
    }
  }

  if (should_crawl && argv_vals["--page-requisites"]) {
    if (current_depth === argv_vals["--level"]) {
      follow_html  = false
    }
    if (current_depth > argv_vals["--level"]) {
      follow_html  = false
      should_crawl = !is_html
    }
  }

  if (should_crawl) {
    log(Array(41).join('-'))
    log('crawling page:', {recursion_depth: current_depth, url, is_html: !!is_html, is_css: !!is_css})

    const statusCode               = response.statusCode
    const headers                  = response.headers
    const {new_urls, new_response} = await crawl(argv_vals, {url, redirects, response, current_depth, follow_html, is_html: !!is_html, is_css: !!is_css})
    let new_output_filepath

    if (Array.isArray(new_urls) && new_urls.length) {
      // prepend new urls so they are downloaded immediately,
      // while within the context of: "--recursive/root"
      urls.unshift(...new_urls)
    }

    if (new_response) {
      response = new String(new_response)
      response.statusCode = statusCode
      response.headers    = headers
    }

    if (is_html && is_html.force) {
      new_output_filepath = fp_helper.get_output_filepath(argv_vals, urldata, {url, redirects, response, is_html: true})
    }

    return {url, redirects, response, new_output_filepath}
  }
  else {
    return {url, redirects, response}
  }
}

const should_force_html = (argv_vals, url) => {
  if (Array.isArray(argv_vals["--force-html"]) && argv_vals["--force-html"].length) {
    let _regex

    for (let i=0; i < argv_vals["--force-html"].length; i++) {
      _regex = argv_vals["--force-html"][i]
      if (_regex.test(url)) {
        return true
      }
    }
  }
  return false
}

const crawl = (argv_vals, {url, redirects, response, current_depth, follow_html, is_html, is_css}) => {
  return new Promise((resolve, reject) => {
    let data = []
    response.on('data', (chunk) => { data.push(chunk) })
    response.on('end', () => {
      const text = Buffer.concat(data).toString('utf8')

      response.destroy()
      data = undefined

      resolve(text)
    })
  })
  .then(text => {
    const new_urls = []
    const replacer = process_new_url.bind(this, argv_vals, new_urls, {url, redirects, current_depth, follow_html})
    let regex_url_rules

    if (is_html) {
      regex_url_rules = regex.url_rules.html
      text = process_regex_url_rules(text, regex_url_rules, replacer)

      regex_url_rules = regex.url_rules.css
      text = process_regex_inline_css_rules(text, regex_url_rules, replacer)
    }
    if (is_css) {
      regex_url_rules = regex.url_rules.css
      text = process_regex_url_rules(text, regex_url_rules, replacer)
    }

    return {new_urls, new_response: text}
  })
}

const process_regex_inline_css_rules = (text, regex_url_rules, replacer) => {
  const regex_inline_css_rules = regex.html_content.css
  let regex_inline_css_rule

  if (Array.isArray(regex_inline_css_rules) && regex_inline_css_rules.length) {
    for (let i=0; i < regex_inline_css_rules.length; i++) {
      regex_inline_css_rule = regex_inline_css_rules[i]
      text = process_regex_inline_css_rule(text, regex_inline_css_rule, regex_url_rules, replacer)
    }
  }

  return text
}

const process_regex_inline_css_rule = (text, regex_inline_css_rule, regex_url_rules, replacer) => {
  const _regex      = reset_global_regex(regex_inline_css_rule[0])
  const match_index = regex_inline_css_rule[1]

  return text.replace(_regex, (...matches) => {
    const old_match = matches[0]

    if ((matches.length > match_index) && matches[match_index]) {
      const old_inline_css = matches[match_index]
      const index_start    = old_match.indexOf(old_inline_css)
      const index_end      = index_start + old_inline_css.length

      if (old_inline_css && (index_start >= 0)) {
        const new_inline_css = process_regex_url_rules(old_inline_css, regex_url_rules, replacer)

        return old_match.substring(0, index_start) + new_inline_css + old_match.substring(index_end, old_match.length)
      }
      else {
        return old_match
      }
    }
    else {
      return old_match
    }
  })
}

const process_regex_url_rules = (text, regex_url_rules, replacer) => {
  let regex_url_rule

  if (Array.isArray(regex_url_rules) && regex_url_rules.length) {
    for (let i=0; i < regex_url_rules.length; i++) {
      regex_url_rule = regex_url_rules[i]
      text = process_regex_url_rule(text, regex_url_rule, replacer)
    }
  }

  return text
}

const process_regex_url_rule = (text, regex_url_rule, replacer) => {
  const _regex      = reset_global_regex(regex_url_rule[0])
  const match_index = regex_url_rule[1]

  return text.replace(_regex, (...matches) => {
    const old_match = matches[0]

    if ((matches.length > match_index) && matches[match_index]) {
      const old_url = matches[match_index]
      const new_url = replacer(old_url)

      return new_url
        ? old_match.replace(old_url, new_url)
        : old_match
    }
    else {
      return old_match
    }
  })
}

const process_new_url = (argv_vals, new_urls, {url, redirects, current_depth, follow_html}, new_url) => {
  if (!new_url) return ''

  const base_url = (argv_vals["--base"] && (current_depth === 0))
    ? argv_vals["--base"]
    : url

  // resolve relative urls with respect to either:
  //   - the user-specified "--base" url when the source document is the root url.. from which the web crawl was started
  //   - the absolute url of the source document (after all redirects have been followed)
  new_url = resolve_url(base_url, new_url)

  const is_html    = should_force_html(argv_vals, new_url)
  const follow_url = (is_html && !follow_html)
    ? false
    : should_follow_url(argv_vals, new_url)

  if (follow_url) {
    const urldata             = [new_url]
    const parent_filepath     = fp_helper.get_output_filepath(argv_vals, null, {url, redirects})
    const output_filepath     = fp_helper.get_output_filepath(argv_vals, urldata, {is_html})
    const output_relative_url = get_relative_url(parent_filepath, output_filepath, new_url)

    log('following:', {recursion_depth: (current_depth + 1), url: new_url, relative_url: output_relative_url, absolute_filepath: output_filepath})

    urldata[1] = output_filepath
    urldata[2] = current_depth + 1

    new_urls.push(urldata)
    return argv_vals["--convert-links"] ? encodeURI(output_relative_url) : new_url
  }
  else {
    log('not following:', {recursion_depth: (current_depth + 1), url: new_url})

    return new_url
  }
}

const get_relative_url = (from_filepath, to_filepath, url) => {
  let relative_url = ''

  // relative dirname
  relative_url += path.relative(
    path.dirname(from_filepath),
    path.dirname(to_filepath)
  )

  if (relative_url) {
    relative_url += path.sep + path.basename(to_filepath)
  }
  else {
    // same directory

    if (path.basename(from_filepath) !== path.basename(to_filepath)) {
      // different file
      relative_url += path.basename(to_filepath)
    }
  }

  if (relative_url && (path.sep !== path.posix.sep)) {
    relative_url = relative_url.split(path.sep).join(path.posix.sep)
  }

  if (url) {
    const parsed_url = parse_url(url)
    if (parsed_url.hash) {
      relative_url += parsed_url.hash
    }
  }

  return relative_url
}

const should_follow_url = (argv_vals, new_url) => {
  const root     = argv_vals["--recursive/root"] || {}
  const hostname = get_normalized_hostname(argv_vals, new_url)
  const pathname = get_normalized_pathname(new_url)
  const samehost = (hostname === root.hostname)
  let has_blacklist, has_whitelist

  if (!samehost && !argv_vals["--span-hosts"]) {
    return false
  }

  if (samehost && argv_vals["--no-parent"] && (pathname.indexOf(root.pathname) !== 0)) {
    return false
  }

  if (samehost && Array.isArray(argv_vals["--exclude-directory"]) && argv_vals["--exclude-directory"].length) {
    let _pathname
    has_blacklist = true
    for (let i=0; i < argv_vals["--exclude-directory"].length; i++) {
      _pathname = argv_vals["--exclude-directory"][i]
      if (pathname.indexOf(_pathname) === 0) {
        return false
      }
    }
  }

  if (argv_vals["--span-hosts"] && Array.isArray(argv_vals["--exclude-host"]) && argv_vals["--exclude-host"].length) {
    has_blacklist = true
    if (argv_vals["--exclude-host"].indexOf(hostname) >= 0) {
      return false
    }
  }

  if (Array.isArray(argv_vals["--reject-regex"]) && argv_vals["--reject-regex"].length) {
    let _regex
    has_blacklist = true
    for (let i=0; i < argv_vals["--reject-regex"].length; i++) {
      _regex = argv_vals["--reject-regex"][i]
      if (_regex.test(new_url)) {
        return false
      }
    }
  }

  if (samehost && Array.isArray(argv_vals["--include-directory"]) && argv_vals["--include-directory"].length) {
    let _pathname
    has_whitelist = true
    for (let i=0; i < argv_vals["--include-directory"].length; i++) {
      _pathname = argv_vals["--include-directory"][i]
      if (pathname.indexOf(_pathname) === 0) {
        return true
      }
    }
  }

  if (argv_vals["--span-hosts"] && Array.isArray(argv_vals["--include-host"]) && argv_vals["--include-host"].length) {
    has_whitelist = true
    if (argv_vals["--include-host"].indexOf(hostname) >= 0) {
      return true
    }
  }

  if (Array.isArray(argv_vals["--accept-regex"]) && argv_vals["--accept-regex"].length) {
    let _regex
    has_whitelist = true
    for (let i=0; i < argv_vals["--accept-regex"].length; i++) {
      _regex = argv_vals["--accept-regex"][i]
      if (_regex.test(new_url)) {
        return true
      }
    }
  }

  return !has_whitelist
}

module.exports = {apply_crawler_middleware}
