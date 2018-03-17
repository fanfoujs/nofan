'use strict'

module.exports = (config, showAll) => {
  let promptList = [
    {
      type: 'input',
      name: 'key',
      message: 'Enter your consumer key',
      default: config.CONSUMER_KEY
    }, {
      type: 'input',
      name: 'secret',
      message: 'Enter your consumer secret',
      default: config.CONSUMER_SECRET
    }, {
      type: 'input',
      name: 'display_count',
      message: 'How many statuses would you like to display (1 - 60)',
      default: config.DISPLAY_COUNT || 10
    }, {
      type: 'checkbox',
      name: 'display',
      message: 'Global Settings',
      choices: [
        {
          name: 'time_tag',
          checked: config.TIME_TAG
        }, {
          name: 'photo_tag',
          checked: config.PHOTO_TAG
        }, {
          name: 'use_https',
          checked: config.SSL || false
        }
      ]
    }
  ]
  if (showAll) {
    promptList = promptList.concat([{
      type: 'input',
      name: 'api_domain',
      message: 'Config your api domain',
      default: config.API_DOMAIN || 'api.fanfou.com'
    }, {
      type: 'input',
      name: 'oauth_domain',
      message: 'Config your oauth domain',
      default: config.OAUTH_DOMAIN || 'fanfou.com'
    }, {
      type: 'checkbox',
      name: 'https',
      message: `Replace 'https' with 'http' in OAuth base string`,
      choices: [{
        name: 'fake_https',
        checked: config.FAKE_HTTPS || false
      }]
    }])
  }
  return promptList
}
