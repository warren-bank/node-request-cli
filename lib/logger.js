const debug = (process.env.NODE_ENV === 'development')

const log = (...args) => {
  if (!debug) return
  console.log(...args)
}

module.exports = log
