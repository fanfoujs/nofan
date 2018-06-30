'use strict'

const replyPrompt = statuses => {
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
    choices: ['Reply', 'Repost', 'Cancel']
  }]
}

const replyInputPrompt = messageTxt => {
  return [{
    type: 'input',
    name: 'content',
    message: messageTxt
  }]
}

module.exports = {
  replyPrompt,
  replyInputPrompt
}
