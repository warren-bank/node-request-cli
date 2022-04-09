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
      "--span-subdomains":       {bool: true},
      "--span-hosts":            {bool: true},
      "--domains":               {many: true},
      "--exclude-domains":       {many: true},
      "--accept-regex":          {regex: "i", many: true},
      "--reject-regex":          {regex: "i", many: true},

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
      "--span-subdomains":       ["-sD"],
      "--span-hosts":            ["-sH"],  // non-standard: "-H" is allocated to "curl" addon, as an alias for "--header"
      "--domains":               ["--domain", "-D"],
      "--exclude-domains":       ["-xD"],

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

    argv_vals["--domains"]         = normalize_domain_list(argv_vals["--domains"])
    argv_vals["--exclude-domains"] = normalize_domain_list(argv_vals["--exclude-domains"])

    if (argv_vals["--no-directories"]) {
      argv_vals["--no-parent"] = true
    }

    if (!argv_vals["--force-html"].length) {
      argv_vals["--force-html"].push(
        /^[^\?#]+\.(?:cgi|pl|php[3-5]?|py|asp[x]?|[psx]?html?)(?:[\?#].*)?$/i
      )
    }
  }
}

const normalize_domain_list = (domains) => {
  if (Array.isArray(domains) && domains.length) {
    domains = domains.filter(hostname => !!hostname)
    domains = domains.map(hostname => {
      hostname = hostname.split('.')
      if (hostname.length > 2) {
        hostname = hostname.slice(hostname.length - 2, hostname.length)
      }
      hostname = hostname.join('.').toLowerCase()
      return hostname
    })
    return domains
  }
  else {
    return []
  }
}

module.exports = {
  add_argv_flags,
  add_argv_flag_aliases,
  process_argv_vals
}
