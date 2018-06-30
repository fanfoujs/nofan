'use strict'

module.exports = statuses => {
  return [{
    type: 'list',
    name: 'status',
    message: 'Select fan to reply',
    choices: statuses
  },
  {
    type: 'list',
    name: 'replyType',
    message: 'Reply or Repost',
    choices: ['Reply', 'Repost']
  }]
}
