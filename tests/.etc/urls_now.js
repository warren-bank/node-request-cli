const fs = require('fs')

const dirpath = process.argv[2]

const entries = fs.readdirSync(dirpath, {withFileTypes: true, encoding: 'utf8'})

const timestamps = []

let file, json
for (let i=0; i < entries.length; i++) {
  try {
    file = entries[i]
    if (!file.isFile()) continue
    if (file.name.indexOf('json') === -1) continue

    json = require(dirpath + '/' + file.name)

    timestamps.push({
      filename:  file.name,
      timestamp_secs: json.unixtime
    })
  }
  catch(e) {}
}

if (timestamps.length) {
  timestamps.sort((t1, t2) => {
    // ascending order
    return (t1.timestamp_secs < t2.timestamp_secs)
      ? -1
      : (t1.timestamp_secs > t2.timestamp_secs)
        ? 1
        : 0
  })

  let basetime = timestamps[0].timestamp_secs

  for (let i=0; i < timestamps.length; i++) {
    timestamps[i].offset_secs = timestamps[i].timestamp_secs - basetime
  }

  console.log(JSON.stringify(timestamps, null, 2))
}
