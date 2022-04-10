const add_argv_flags = (argv_flags) => {
  Object.assign(
    argv_flags,
    {
      "--head":                  {bool: true}
    }
  )
}

const add_argv_flag_aliases = (argv_flag_aliases) => {
  Object.assign(
    argv_flag_aliases,
    {
      "--head":                  ["-I"]
    }
  )

  merge_argv_flag_aliases(
    argv_flag_aliases,
    {
      "--referer":               ["-e"],
      "--user-agent":            ["-A"],
      "--header":                ["-H"],
      "--method":                ["--request", "-X"],
      "--post-data":             ["--form", "--data", "-d"],
      "--no-check-certificate":  ["--insecure"],
      "--output-document":       ["--output", "-o"]
    }
  )
}

const merge_argv_flag_aliases = (old_aliases, new_aliases) => {
  const new_keys = Object.keys(new_aliases)
  let key

  for (let i=0; i < new_keys.length; i++) {
    key = new_keys[i]

    old_aliases[key] = (Array.isArray(old_aliases[key]))
      ? old_aliases[key].concat(new_aliases[key])
      : new_aliases[key]
  }
}

const process_argv_vals = (argv_vals) => {
  if (argv_vals["--head"]) {
    // --method HEAD --server-response --dry-run

    argv_vals["--method"]             = 'HEAD'
    argv_vals["--server-response"]    = true
    argv_vals["--dry-run"]            = true
  }
}

module.exports = {
  add_argv_flags,
  add_argv_flag_aliases,
  process_argv_vals
}
