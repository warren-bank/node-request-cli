const add_argv_flags = (argv_flags) => {
}

const add_argv_flag_aliases = (argv_flag_aliases) => {
  merge_argv_flag_aliases(
    argv_flag_aliases,
    {
      "--referer":               ["-e"],
      "--user-agent":            ["-A"],
      "--header":                ["-H"],
      "--method":                ["-X"],
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
}

module.exports = {
  add_argv_flags,
  add_argv_flag_aliases,
  process_argv_vals
}
