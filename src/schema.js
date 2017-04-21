'use strict'

const schema = {
  login: {
    properties: {
      username: {
        description: 'Enter your username',
        required: true
      },
      password: {
        description: 'Enter your password',
        hidden: true,
        replace: '*'
      }
    }
  },
  config: {
    properties: {
      consumer_key: {
        description: 'Enter your consumer key',
        required: true
      },
      consumer_secret: {
        description: 'Enter your consumer secret',
        required: true
      }
    }
  }
}

module.exports = schema
