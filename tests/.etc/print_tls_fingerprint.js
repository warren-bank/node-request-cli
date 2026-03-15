const json_filepath = process.argv[2]
const output_prefix = process.argv[3]

const data = require(json_filepath)

const output_data = {
  ja3_fingerprint:    data?.tls?.ja3_hash,
  ja4_fingerprint:    data?.tls?.ja4,
  akamai_fingerprint: data?.http2?.akamai_fingerprint_hash,
  session_id:         data?.tls?.session_id,
  tls_ciphers:        (data?.tls?.ciphers || []).join(':')
}

console.log(output_prefix + JSON.stringify(output_data))
