const fs = require('fs')

const regex = {
  b64encode: /\{\{btoa\s+(.*?)\s*\}\}/g,
  b64decode: /\{\{atob\s+(.*?)\s*\}\}/g,

  urlencode: /\{\{\+\s*(.*?)\s*\}\}/g,
  urldecode: /\{\{\-\s*(.*?)\s*\}\}/g,

  filepath:  /\{\{\@\s*(.*?)\s*\}\}/g,
  qs: /(?:^|&)([^=]+)=([^&]*)/g
}

const process_post_data = (POST_data, content_type) => {
  if (!POST_data || !(typeof POST_data === 'string')) return null

  POST_data = POST_data.replace(regex.b64encode, (match, p1) => p1 ? btoa(p1) : '')
  POST_data = POST_data.replace(regex.b64decode, (match, p1) => p1 ? atob(p1) : '')

  POST_data = POST_data.replace(regex.urlencode, (match, p1) => p1 ? encodeURIComponent(p1) : '')
  POST_data = POST_data.replace(regex.urldecode, (match, p1) => p1 ? decodeURIComponent(p1) : '')

  const placeholder = '{{xXx---stream---Readable---xXx}}'
  const files = []

  POST_data = POST_data.replace(regex.filepath, (match, p1) => {
    if (!p1) return ''

    if (p1[0] === '-') {
      let filename, mime

      if (p1.length > 1) {
        p1 = p1.substring(1, p1.length)

        // token (chosen arbitrarily) to separate an optional filename from an optional mime-type
        //   ex: image.png | image/png
        // in most cases, an explicit mime-type is not necessary; it will be chosen based on the filename extension.
        const sep = '|'
        const pos = p1.indexOf(sep)

        if (pos >= 0) {
          if (pos > 0) {
            filename = p1.substring(0, pos).trim()
          }

          if (pos + 1 < p1.length) {
            mime = p1.substring(pos + 1, p1.length).trim()
          }
        }
        else {
          filename = p1.trim()
        }
      }

      files.push({file: process.stdin, filename, mime})
      return placeholder
    }

    try {
      p1 = fs.realpathSync(p1)
    }
    catch(e) {
      // file path does not exist
      return ''
    }

    files.push({filename: p1})
    return placeholder
  })

  const require_multipart_form_data = (content_type && (typeof content_type === 'string') && (content_type.toLowerCase().indexOf('multipart/form-data') >= 0))

  if (!files.length && !require_multipart_form_data)
    return POST_data

  // multipart/form-data
  const fields = []
  let matches, field_name, field_value

  while (matches = regex.qs.exec(POST_data)) {
    field_name  = matches[1]
    field_value = matches[2]

    if (!field_value) continue

    field_name  = decodeURIComponent(field_name)
    field_name  = encodeURIComponent(field_name)

    field_value = decodeURIComponent(field_value)

    if (field_value === placeholder)
      field_value = files.shift()

    fields.push({name: field_name, value: field_value})
  }

  return fields.length
    ? fields
    : null
}

module.exports = process_post_data
