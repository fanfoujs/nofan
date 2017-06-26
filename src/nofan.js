'use strict'

const fs = require('fs')
const colors = require('colors/safe')
const Fanfou = require('fanfou-sdk')
const inquirer = require('inquirer')
const TimeAgo = require('timeago.js')
const util = require('./util')
const figlet = require('figlet')

class Nofan {
  /**
   * command `nofan login`
   */
  static async login (username, password) {
    const config = await util.getConfig()
    const login = (username, password) => {
      const ff = new Fanfou({
        auth_type: 'xauth',
        consumer_key: config.CONSUMER_KEY,
        consumer_secret: config.CONSUMER_SECRET,
        username: username,
        password: password,
        protocol: config.SSL ? 'https:' : 'http:',
        api_domain: config.API_DOMAIN,
        oauth_domain: config.OAUTH_DOMAIN
      })
      ff.xauth(async (e, token) => {
        if (e) console.log(colors.red(e.message))
        else {
          config.USER = username
          await util.setConfig(config)
          const account = await util.getAccount()
          account[username] = {
            CONSUMER_KEY: config.CONSUMER_KEY,
            CONSUMER_SECRET: config.CONSUMER_SECRET,
            OAUTH_TOKEN: token.oauth_token,
            OAUTH_TOKEN_SECRET: token.oauth_token_secret
          }
          await util.setAccount(account)
          console.log(colors.green('Login succeed!'))
        }
      })
    }
    if (username && password) {
      login(username, password)
    } else {
      inquirer.prompt([
        {
          type: 'input',
          name: 'username',
          message: 'Enter your username'
        }, {
          type: 'password',
          name: 'password',
          message: 'Enter your password'
        }
      ]).then(async user => {
        login(user.username, user.password)
      })
    }
  }

  /**
   * command `nofan logout`
   */
  static async logout () {
    const config = await util.getConfig()
    if (config.hasOwnProperty('USER')) {
      const account = await util.getAccount()
      delete account[config.USER]
      await util.setAccount(account)
      console.log(colors.green('Logout succeed!'))
    }
  }

  /**
   * command `nofan config`
   */
  static async config (key, secret, showAll) {
    const config = await util.getConfig()
    if (key && secret) {
      config.CONSUMER_KEY = key
      config.CONSUMER_SECRET = secret

      await util.createNofanDir()
      await util.setConfig(config)
    } else {
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
        }])
      }
      inquirer.prompt(promptList).then(async settings => {
        config.CONSUMER_KEY = settings.key
        config.CONSUMER_SECRET = settings.secret
        config.DISPLAY_COUNT = settings.display_count
        config.TIME_TAG = settings.display.indexOf('time_tag') !== -1
        config.PHOTO_TAG = settings.display.indexOf('photo_tag') !== -1
        config.SSL = settings.display.indexOf('use_https') !== -1
        if (settings.api_domain) config.API_DOMAIN = settings.api_domain
        if (settings.oauth_domain) config.OAUTH_DOMAIN = settings.oauth_domain

        await util.createNofanDir()
        await util.setConfig(config)
      })
    }
  }

  /**
   * command `nofan switch`
   */
  static async switchUser (id) {
    const config = await util.getConfig()
    const account = await util.getAccount()
    if (id) {
      if (account.hasOwnProperty(id)) {
        config.USER = id
        await util.setConfig(config)
        console.log(colors.green('Switch account to', id))
      } else {
        console.log(colors.red(id, 'needs login'))
      }
    } else {
      const choices = []
      const currentName = config.USER
      for (const name in account) {
        if (account.hasOwnProperty(name)) {
          if (currentName === name) choices.push({name: name, disabled: colors.green('current')})
          else choices.push(name)
        }
      }
      if (choices.length > 1) {
        inquirer.prompt([
          {
            type: 'list',
            name: 'username',
            message: 'Switch account to',
            choices: choices,
            pageSize: 20
          }
        ]).then(async user => {
          config.USER = user.username
          await util.setConfig(config)
        })
      } else {
        console.log('no more account')
      }
    }
  }

  /**
   * Show home timeline
   */
  static async homeTimeline (options) {
    options = options || {}
    const config = await util.getConfig()
    const count = options.count || config.DISPLAY_COUNT || 10
    const timeAgo = options.time_ago || false
    const noPhotoTag = options.no_photo_tag || false
    Nofan._get('/statuses/home_timeline', {count: count, format: 'html'}, (e, statuses) => {
      if (e) console.error(e.message)
      else {
        Nofan._displayTimeline(statuses, timeAgo, noPhotoTag)
      }
    })
  }

  /**
   * Show public timeline
   */
  static async publicTimeline (options) {
    options = options || {}
    const config = await util.getConfig()
    const count = options.count || config.DISPLAY_COUNT || 10
    const timeAgo = options.time_ago || false
    const noPhotoTag = options.no_photo_tag || false
    Nofan._get('/statuses/public_timeline', {count: count, format: 'html'}, (e, statuses) => {
      if (e) console.error(e.message)
      else {
        Nofan._displayTimeline(statuses, timeAgo, noPhotoTag)
      }
    })
  }

  /**
   * Post new status
   * @param text {text}
   */
  static update (text) {
    Nofan._post('/statuses/update', {status: text}, (e) => {
      if (e) console.log(e.message)
    })
  }

  /**
   * Post new status with photo
   * @param path
   * @param text
   */
  static upload (path, text) {
    Nofan._upload(path, text, (e) => {
      if (e) console.log(e.message)
    })
  }

  /**
   * command `nofan undo`
   */
  static undo () {
    Nofan._get('/statuses/user_timeline', {}, (e, statuses) => {
      if (e) console.error(e.message)
      else {
        Nofan._post('/statuses/destroy', {id: statuses[0].id}, (e) => {
          if (e) console.error(e.message)
        })
      }
    })
  }

  /**
   * command `nofan mentions`
   */
  static async mentions (options) {
    options = options || {}
    const config = await util.getConfig()
    const count = options.count || config.DISPLAY_COUNT || 10
    const timeAgo = options.time_ago || false
    const noPhotoTag = options.no_photo_tag || false
    Nofan._get('/statuses/mentions', {count: count, format: 'html'}, (e, statuses) => {
      if (e) console.error(e.message)
      else {
        Nofan._displayTimeline(statuses, timeAgo, noPhotoTag)
      }
    })
  }

  /**
   * command `nofan me`
   */
  static async me (options) {
    options = options || {}
    const config = await util.getConfig()
    const count = options.count || config.DISPLAY_COUNT || 10
    const timeAgo = options.time_ago || false
    const noPhotoTag = options.no_photo_tag || false
    Nofan._get('/statuses/user_timeline', {count: count, format: 'html'}, (e, statuses) => {
      if (e) console.error(e.message)
      else {
        Nofan._displayTimeline(statuses, timeAgo, noPhotoTag)
      }
    })
  }

  static async _get (uri, params, callback) {
    const config = await util.getConfig()
    const account = await util.getAccount()
    let user = account[config.USER]
    if (!user) {
      for (const name in account) {
        if (account.hasOwnProperty(name)) {
          user = account[name]
          config.USER = name
          break
        }
      }
      if (!user) {
        console.log('not logged in')
        return
      }
    }
    util.setConfig(config)
    const ff = new Fanfou({
      auth_type: 'oauth',
      consumer_key: user.CONSUMER_KEY,
      consumer_secret: user.CONSUMER_SECRET,
      oauth_token: user.OAUTH_TOKEN,
      oauth_token_secret: user.OAUTH_TOKEN_SECRET,
      protocol: config.SSL ? 'https:' : 'http:',
      api_domain: config.API_DOMAIN,
      oauth_domain: config.OAUTH_DOMAIN
    })
    ff.get(uri, params, (e, res, obj) => {
      callback(e, res, obj)
    })
  }

  static async _post (uri, params, callback) {
    const config = await util.getConfig()
    const account = await util.getAccount()
    let user = account[config.USER]
    if (!user) {
      for (const name in account) {
        if (account.hasOwnProperty(name)) {
          user = account[name]
          config.USER = name
          break
        }
      }
      if (!user) {
        console.log('not logged in')
        return
      }
    }
    util.setConfig(config)
    const ff = new Fanfou({
      auth_type: 'oauth',
      consumer_key: user.CONSUMER_KEY,
      consumer_secret: user.CONSUMER_SECRET,
      oauth_token: user.OAUTH_TOKEN,
      oauth_token_secret: user.OAUTH_TOKEN_SECRET,
      protocol: config.SSL ? 'https:' : 'http:',
      api_domain: config.API_DOMAIN,
      oauth_domain: config.OAUTH_DOMAIN
    })
    ff.post(uri, params, (e, res, obj) => {
      callback(e, res, obj)
    })
  }

  static async _upload (path, status, callback) {
    const config = await util.getConfig()
    const account = await util.getAccount()
    let user = account[config.USER]
    if (!user) {
      for (const name in account) {
        if (account.hasOwnProperty(name)) {
          user = account[name]
          config.USER = name
          break
        }
      }
      if (!user) {
        console.log('not logged in')
        return
      }
    }
    util.setConfig(config)
    const ff = new Fanfou({
      auth_type: 'oauth',
      consumer_key: user.CONSUMER_KEY,
      consumer_secret: user.CONSUMER_SECRET,
      oauth_token: user.OAUTH_TOKEN,
      oauth_token_secret: user.OAUTH_TOKEN_SECRET,
      protocol: config.SSL ? 'https:' : 'http:',
      api_domain: config.API_DOMAIN,
      oauth_domain: config.OAUTH_DOMAIN
    })
    fs.open(path, 'r', (e, fd) => {
      if (e) {
        if (e.code === 'ENOENT') {
          console.error(colors.red(`file '${path}' does not exist`))
        } else throw e
      } else {
        ff.upload(
          fs.createReadStream(path),
          status,
          (e) => {
            if (e) callback(e)
            else callback(null)
          }
        )
      }
    })
  }

  static async _displayTimeline (timeline, timeAgoTag, noPhotoTag) {
    const config = await util.getConfig()
    timeAgoTag = timeAgoTag || config.TIME_TAG
    noPhotoTag = noPhotoTag || !config.PHOTO_TAG
    timeline.forEach(status => {
      let text = ''
      status.txt.forEach(item => {
        switch (item.type) {
          case 'at':
          case 'tag':
          case 'link':
            text += colors.blue(item.text)
            break
          default:
            text += item.text
        }
      })
      if (status.photo && !noPhotoTag) {
        if (text.length) text += colors.blue(' [图]')
        else text += colors.blue('[图]')
      }
      if (!timeAgoTag) {
        console.log(`[${colors.green(status.user.name)}] ${text}`)
      } else {
        const statusTimeAgo = colors.green(`(${new TimeAgo().format(status.created_at)})`)
        console.log(`[${colors.green(status.user.name)}] ${text} ` + statusTimeAgo)
      }
    })
  }

  static version () {
    const banner = colors.blue(figlet.textSync('Nofan', {
      font: 'Slant'
    }))
    const nofanVersion = colors.green(`nofan: ${require('../package').version}`)
    const sdkVersion = colors.green(`fanfou-sdk: ${util.sdkVersion()}`)
    const version = `${banner}\n${nofanVersion}\n${sdkVersion}`
    return version
  }
}

module.exports = Nofan
