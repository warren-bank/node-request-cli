// -----------------------------------------------------------------------------

const extract_filename = (header, URL) => {
  const filename = extract_filename_header(header) || extract_filename_URL(URL) || get_hash(URL)
  return filename
}

// -----------------------------------------------------------------------------

const extract_filename_header = (header) => {
  if (!header) return ''

  let regex, match

  regex = /filename=(['"])([^\1]+)\1/i
  match = String(header).match(regex)
  if (match && (match.length >= 3)) return match[2]

  regex = /filename=([^\s]+)(?:[\s]|$)/i
  match = String(header).match(regex)
  if (match && (match.length >= 2)) return match[1]

  return ''
}

// -----------------------------------------------------------------------------

const extract_filename_URL = (URL) => {
  if (!URL) return ''

  const regex = /\/([^\/]+\.[^\/\.]{1,4})(?:[\?#]|$)/
  const match = String(URL).match(regex)
  if (match && (match.length >= 2)) return match[1]

  return ''
}

// -----------------------------------------------------------------------------

const get_hash = (URL, algorithm='sha256') => {
  const crypto = require('crypto')
  const hash   = crypto.createHash(algorithm)
  hash.update(URL)
  return hash.digest('hex')
}

// -----------------------------------------------------------------------------

module.exports = extract_filename
