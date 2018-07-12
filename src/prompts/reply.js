'use strict'
const stream = require('stream')
const lineWrap = require('line-wrap')

function wrapStatues (status) {
  const wrapStream = lineWrap({width: 50})
  const s = new stream.Readable()
  s._read = () => {}
  s.push(status.name)
  s.push(null)
  s.pipe(wrapStream).pipe(process.stdout)
  return status
}

const list = statuses => {
  statuses.map(wrapStatues)
  return [{
    type: 'list',
    name: 'status',
    message: 'Select status to reply',
    choices: statuses
  }]
}

const input = messageTxt => {
  return [{
    type: 'input',
    name: 'content',
    message: messageTxt
  }]
}

module.exports = {
  list,
  input
}
