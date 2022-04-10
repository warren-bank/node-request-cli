const add_argv_flags = (argv_flags) => {
  Object.assign(
    argv_flags,
    {
      "--spider":                {bool: true},
      "--mirror":                {bool: true},
      "--recursive":             {bool: true},
      "--level":                 {num: "int"},
      "--page-requisites":       {bool: true},
      "--adjust-extension":      {bool: true},
      "--convert-links":         {bool: true},
      "--no-parent":             {bool: true},
      "--exclude-directory":     {many: true},
      "--include-directory":     {many: true},
      "--span-subdomains":       {bool: true},
      "--span-hosts":            {bool: true},
      "--exclude-host":          {many: true},
      "--include-host":          {many: true},
      "--reject-regex":          {regex: "i", many: true},
      "--accept-regex":          {regex: "i", many: true},

      "--no-directories":        {bool: true},
      "--protocol-directories":  {bool: true},
      "--no-host-directories":   {bool: true},
      "--cut-dirs":              {num: "int"},

      "--force-html":            {regex: "i", many: true},
      "--base":                  {}
    }
  )
}

const add_argv_flag_aliases = (argv_flag_aliases) => {
  Object.assign(
    argv_flag_aliases,
    {
      "--mirror":                ["-m"],
      "--recursive":             ["-r"],
      "--level":                 ["-l"],
      "--page-requisites":       ["-p"],
      "--adjust-extension":      ["-E"],
      "--convert-links":         ["-k"],
      "--no-parent":             ["-np"],
      "--exclude-directory":     ["-xD", "--exclude"],               // non-standard: "-X" is allocated to "curl" addon, as an alias for "--method"
      "--include-directory":     ["-iD", "--include"],               // non-standard: "-I" is allocated to "curl" addon, as an alias for "--head"
      "--span-subdomains":       ["-sD"],
      "--span-hosts":            ["-sH"],                            // non-standard: "-H" is allocated to "curl" addon, as an alias for "--header"
      "--exclude-host":          ["-xH", "--exclude-domains"],
      "--include-host":          ["-iH", "--domains", "-D"],

      "--no-directories":        ["-nd"],
      "--no-host-directories":   ["-nH"],

      "--force-html":            ["-F"],
      "--base":                  ["-B"]
    }
  )
}

const process_argv_vals = (argv_vals) => {
  if (argv_vals["--spider"]) {
    // --mirror --server-response --dry-run

    argv_vals["--mirror"]             = true
    argv_vals["--server-response"]    = true
    argv_vals["--dry-run"]            = true
  }

  if (argv_vals["--mirror"]) {
    // -r --trust-server-names -E -k -l 0

    argv_vals["--recursive"]          = true
    argv_vals["--trust-server-names"] = true
    argv_vals["--adjust-extension"]   = true
    argv_vals["--convert-links"]      = true

    if (argv_vals["--level"] === undefined) {
      argv_vals["--level"] = Number.MAX_SAFE_INTEGER
    }
  }

  if (argv_vals["--recursive"]) {
    argv_vals["--max-concurrency"] = 1
    argv_vals["--output-document"] = null
    argv_vals["--no-clobber"]      = true

    if (argv_vals["--level"] === undefined) {
      argv_vals["--level"] = 5
    }
    if (argv_vals["--level"] === 0) {
      argv_vals["--level"] = Number.MAX_SAFE_INTEGER
    }

    argv_vals["--exclude-host"] = normalize_hosts_list(argv_vals, argv_vals["--exclude-host"])
    argv_vals["--include-host"] = normalize_hosts_list(argv_vals, argv_vals["--include-host"])

    if (!argv_vals["--force-html"].length) {
      argv_vals["--force-html"].push(
        /^[^\?#]+\.(?:cgi|pl|php[3-5]?|py|asp[x]?|[psx]?html?)(?:[\?#].*)?$/i
      )
    }
  }
}

const normalize_hosts_list = (argv_vals, hosts) => {
  if (Array.isArray(hosts) && hosts.length) {
    hosts = hosts.map(hostname => normalize_hostname(argv_vals, hostname))
    hosts = hosts.filter(hostname => !!hostname)
    return hosts
  }
  else {
    return []
  }
}

const normalize_hostname = (argv_vals, hostname) => {
  if (hostname && (typeof hostname === 'string')) {
    hostname = hostname.toLowerCase()

    if (argv_vals["--span-subdomains"]) {
      // normalize hostname to only contain the top 2x levels of the domain
      hostname = hostname.split('.')
      if (hostname.length > 2) {
        hostname = hostname.slice(hostname.length - 2, hostname.length)
      }
      hostname = hostname.join('.')
    }
    return hostname
  }
  return ''
}

module.exports = {
  add_argv_flags,
  add_argv_flag_aliases,
  process_argv_vals,
  normalize_hostname
}
