'use strict'

module.exports = mentions => {
  return [{
    type: 'list',
    name: 'Mentions',
    message: 'Select fan to reply',
    choices: mentions
  }]
}
