'use strict'

const list = statuses => {
  return [{
    type: 'list',
    name: 'status',
    message: 'Select fan to reply',
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
