'use strict'

const gradient = require('gradient-string')
const chalkPipe = require('chalk-pipe')
const TimeAgo = require('timeago.js')
const Fanfou = require('fanfou-sdk')
const inquirer = require('inquirer')
const figlet = require('figlet')
const boxen = require('boxen')
const chalk = require('chalk')
const pangu = require('pangu')
const ora = require('ora')
const fs = require('fs')

const util = require('./util')
const prompts = require('./prompts')

inquirer.registerPrompt('color-input', require('inquirer-chalk-pipe'))

class Nofan {
  /**
   * command `nofan login`
   */
  static async login (username, password) {
    const config = await util.getConfig()
    const login = (username, password) => {
      const ff = new Fanfou({
        authType: 'xauth',
        consumerKey: config.CONSUMER_KEY,
        cosnumerSecret: config.CONSUMER_SECRET,
        username,
        password,
        protocol: config.SSL ? 'https:' : 'http:',
        apiDomain: config.API_DOMAIN,
        oauthDomain: config.OAUTH_DOMAIN,
        fakeHttps: config.FAKE_HTTPS || false
      })
      ff.xauth(async (e, token) => {
        if (e) process.spinner.fail(pangu.spacing(e.message))
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
          process.spinner.succeed('Login succeed!')
        }
      })
    }
    if (username && password) {
      process.spinner = ora('Logging in...').start()
      login(username, password)
    } else {
      const user = await inquirer.prompt(prompts.login)
      process.spinner = ora('Logging in').start()
      login(user.username, user.password)
    }
  }

  /**
   * command `nofan logout`
   */
  static async logout () {
    process.spinner = ora('Logging out').start()
    const config = await util.getConfig()
    if (config.hasOwnProperty('USER')) {
      const account = await util.getAccount()
      delete account[config.USER]
      await util.setAccount(account)
      process.spinner.succeed('Logout succeed!')
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
      const settings = await inquirer.prompt(prompts.config(config, showAll))
      config.CONSUMER_KEY = settings.key || ''
      config.CONSUMER_SECRET = settings.secret || ''
      config.DISPLAY_COUNT = settings.display_count
      config.TIME_TAG = settings.display.indexOf('time_tag') !== -1
      config.PHOTO_TAG = settings.display.indexOf('photo_tag') !== -1
      config.SSL = settings.display.indexOf('use_https') !== -1
      if (settings.api_domain) config.API_DOMAIN = settings.api_domain
      if (settings.oauth_domain) config.OAUTH_DOMAIN = settings.oauth_domain
      if (settings.https) config.FAKE_HTTPS = settings.https.indexOf('fake_https') !== -1
      await util.createNofanDir()
      await util.setConfig(config)
    }
  }

  /**
   * command `nofan colors`
   */
  static async colors () {
    const config = await util.getConfig()
    config.COLORS = config.COLORS || {}
    const paints = await inquirer.prompt(prompts.colors(config))
    const colors = {...paints}
    config.COLORS = colors
    await util.createNofanDir()
    await util.setConfig(config)
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
        process.spinner = ora().succeed(`Switch account to ${chalk.blue.bold(id)}`)
      } else {
        process.spinner = ora().info(`${chalk.blue.bold(id)} needs login`)
      }
    } else {
      const choices = []
      const currentName = config.USER
      for (const name in account) {
        if (account.hasOwnProperty(name)) {
          if (currentName === name) choices.push({name, disabled: chalk.green('current')})
          else choices.push(name)
        }
      }
      if (choices.length > 1) {
        const user = await inquirer.prompt(prompts.switchy(choices))
        config.USER = user.username
        await util.setConfig(config)
      } else {
        process.spinner = ora().info('No more account')
      }
    }
  }

  /**
   * Show home timeline
   */
  static async homeTimeline (options) {
    options = options || {}
    process.NOFAN_CONFIG = await util.getConfig()
    const count = options.count || process.NOFAN_CONFIG.DISPLAY_COUNT || 10
    const timeAgo = options.time_ago || false
    const noPhotoTag = options.no_photo_tag || false
    Nofan._get('/statuses/home_timeline', {count, format: 'html'}, (e, statuses) => {
      if (e) process.spinner.fail(pangu.spacing(e.message))
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
    process.NOFAN_CONFIG = await util.getConfig()
    const count = options.count || process.NOFAN_CONFIG.DISPLAY_COUNT || 10
    const timeAgo = options.time_ago || false
    const noPhotoTag = options.no_photo_tag || false
    Nofan._get('/statuses/public_timeline', {count, format: 'html'}, (e, statuses) => {
      if (e) process.spinner.fail(pangu.spacing(e.message))
      else {
        Nofan._displayTimeline(statuses, timeAgo, noPhotoTag)
      }
    })
  }

  /**
   * Search public timeline
   */
  static async searchTimeline (q, options) {
    options = options || {}
    process.NOFAN_CONFIG = await util.getConfig()
    const count = options.count || process.NOFAN_CONFIG.DISPLAY_COUNT || 10
    const timeAgo = options.time_ago || false
    const noPhotoTag = options.no_photo_tag || false
    Nofan._get('/search/public_timeline', {q, count, format: 'html'}, (e, statuses) => {
      if (e) process.spinner.fail(pangu.spacing(e.message))
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
      if (e) process.spinner.fail(pangu.spacing(e.message))
      else process.spinner.succeed('Sent!')
    })
  }

  /**
   * Post new status with photo
   * @param path
   * @param text
   */
  static upload (path, text) {
    Nofan._upload(path, text, (e) => {
      if (e) process.spinner.fail(pangu.spacing(e.message))
      else process.spinner.succeed('Sent!')
    })
  }

  /**
   * command `nofan undo`
   */
  static undo () {
    Nofan._get('/statuses/user_timeline', {}, (e, statuses) => {
      if (e) process.spinner.fail(pangu.spacing(e.message))
      else {
        Nofan._post('/statuses/destroy', {id: statuses[0].id}, (e) => {
          if (e) process.spinner.fail(pangu.spacing(e.message))
          else process.spinner.succeed('Deleted!')
        })
      }
    })
  }

  /**
   * command `nofan mentions`
   */
  static async mentions (options) {
    options = options || {}
    process.NOFAN_CONFIG = await util.getConfig()
    const count = options.count || process.NOFAN_CONFIG.DISPLAY_COUNT || 10
    const timeAgo = options.time_ago || false
    const noPhotoTag = options.no_photo_tag || false
    Nofan._get('/statuses/mentions', {count, format: 'html'}, (e, statuses) => {
      if (e) process.spinner.fail(pangu.spacing(e.message))
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
    process.NOFAN_CONFIG = await util.getConfig()
    const count = options.count || process.NOFAN_CONFIG.DISPLAY_COUNT || 10
    const timeAgo = options.time_ago || false
    const noPhotoTag = options.no_photo_tag || false
    Nofan._get('/statuses/user_timeline', {count, format: 'html'}, (e, statuses) => {
      if (e) process.spinner.fail(pangu.spacing(e.message))
      else {
        Nofan._displayTimeline(statuses, timeAgo, noPhotoTag)
      }
    })
  }

  static async _get (uri, params, callback) {
    const config = process.NOFAN_CONFIG ? process.NOFAN_CONFIG : await util.getConfig()
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
        process.spinner.fail('Not logged in')
        return
      }
    }
    util.setConfig(config)

    const ff = Nofan.initFanfou(user, config)

    ff.get(uri, params, (e, res, obj) => {
      const expectHttpsError = /Invalid signature\. Expected basestring is GET&http%3A%2F%2F/
      if (
        config.SSL &&
        !config.FAKE_HTTS &&
        e &&
        typeof e.message === 'string' &&
        e.message.match(expectHttpsError)
      ) {
        const tip = `Please try ${chalk.green('`nofan config -a`')} to switch ${chalk.green('`fake_https`')} on`
        e.message += `\n\n${boxen(tip, {padding: 1})}`
      }
      callback(e, res, obj)
    })
  }

  static async _post (uri, params, callback) {
    const config = process.NOFAN_CONFIG ? process.NOFAN_CONFIG : await util.getConfig()
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
        process.spinner.fail('Not logged in')
        return
      }
    }
    util.setConfig(config)

    const ff = Nofan.initFanfou(user, config)

    ff.post(uri, params, (e, res, obj) => {
      const expectHttpsError = /Invalid signature\. Expected basestring is POST&http%3A%2F%2F/
      if (
        config.SSL &&
        !config.FAKE_HTTS &&
        e &&
        typeof e.message === 'string' &&
        e.message.match(expectHttpsError)
      ) {
        const tip = `Please try ${chalk.green('`nofan config -a`')} to switch ${chalk.green('`fake_https`')} on`
        e.message += `\n\n${boxen(tip, {padding: 1})}`
      }
      callback(e, res, obj)
    })
  }

  static async _upload (path, status, callback) {
    const config = process.NOFAN_CONFIG ? process.NOFAN_CONFIG : await util.getConfig()
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
        process.spinner.fail('Not logged in')
        return
      }
    }
    util.setConfig(config)

    const ff = Nofan.initFanfou(user, config)

    fs.open(path, 'r', (e, fd) => {
      if (e) {
        if (e.code === 'ENOENT') {
          process.spinner.fail(`file '${path}' does not exist`)
        } else throw e
      } else {
        ff.up('/photos/upload', {photo: fs.createReadStream(path), status}, err => {
          if (err) {
            const expectHttpError = /Invalid signature\. Expected basestring is POST&http%3A%2F%2F/
            const expectHttpsError = /Invalid signature\. Expected basestring is POST&https%3A%2F%2F/
            if (
              config.SSL &&
              !config.FAKE_HTTS &&
              err &&
              typeof err.message === 'string' &&
              err.message.match(expectHttpError)
            ) {
              const tip = `Please try ${chalk.green('`nofan config -a`')} to switch ${chalk.green('`fake_https`')} on`
              err.message += `\n\n${boxen(tip, {padding: 1})}`
            } else if (
              config.SSL &&
              config.FAKE_HTTPS &&
              err &&
              typeof err.message === 'string' &&
              err.message.match(expectHttpsError)
            ) {
              const tip = `Please try ${chalk.green('`nofan config -a`')} to switch ${chalk.green('`fake_https`')} off`
              err.message += `\n\n${boxen(tip, {padding: 1})}`
            }
            callback(err)
          } else callback(null)
        })
      }
    })
  }

  static async _displayTimeline (timeline, timeAgoTag, noPhotoTag) {
    const config = process.NOFAN_CONFIG
    if (process.spinner) process.spinner.stop()
    timeAgoTag = timeAgoTag || config.TIME_TAG
    noPhotoTag = noPhotoTag || !config.PHOTO_TAG
    const colors = config.COLORS || {}
    const nameColor = colors.name || 'green'
    const textColor = colors.text
    const atColor = colors.at || 'blue'
    const linkColor = colors.link || 'blue'
    const tagColor = colors.tag || 'blue'
    const photoColor = colors.photo || 'blue'
    const timeagoColor = colors.timeago || 'green'
    const highlightColor = colors.highlight || 'bold'
    const parseHighlight = (style, item) => {
      if (item.bold_arr) {
        return item.bold_arr.map(keyword => {
          if (keyword.bold) return chalkPipe(`${style}.${highlightColor}`)(keyword.text)
          return chalkPipe(style)(keyword.text)
        }).join('')
      }
      return false
    }
    timeline.forEach(status => {
      let text = ''
      status.txt.forEach(item => {
        switch (item.type) {
          case 'at':
            text += parseHighlight(atColor, item) || chalkPipe(atColor)(item.text)
            break
          case 'link':
            text += parseHighlight(linkColor, item) || chalkPipe(linkColor)(item.text)
            break
          case 'tag':
            text += parseHighlight(tagColor, item) || chalkPipe(tagColor)(item._text)
            break
          default:
            text += parseHighlight(textColor, item) || chalkPipe(textColor)(item._text)
            break
        }
      })
      const name = chalkPipe(textColor)('[') + chalkPipe(nameColor)(status.user.name) + chalkPipe(textColor)(']')
      if (status.photo && !noPhotoTag) {
        const photoTag = chalkPipe(photoColor)('[图]')
        if (text.length) text += ` ${photoTag}`
        else text += photoTag
      }
      if (!timeAgoTag) {
        console.log(`${name} ${text}`)
      } else {
        const statusTimeAgo = chalkPipe(timeagoColor)(`(${new TimeAgo().format(status.created_at)})`)
        console.log(`${name} ${text} ${statusTimeAgo}`)
      }
    })
  }

  static initFanfou (user, config) {
    return new Fanfou({
      authType: 'oauth',
      consumerKey: user.CONSUMER_KEY,
      consumerSecret: user.CONSUMER_SECRET,
      oauthToken: user.OAUTH_TOKEN,
      oauthTokenSecret: user.OAUTH_TOKEN_SECRET,
      protocol: config.SSL ? 'https:' : 'http:',
      apiDomain: config.API_DOMAIN,
      oauthDomain: config.OAUTH_DOMAIN,
      fakeHttps: config.FAKE_HTTPS || false
    })
  }

  static version () {
    const banner = gradient.rainbow(figlet.textSync('Nofan', {
      font: 'Small Slant'
    }))
    const nofanVersion = chalk.cyanBright(`nofan: ${require('../package').version}`)
    const sdkVersion = chalk.green(`fanfou-sdk: ${util.sdkVersion()}`)
    const streamerVersion = chalk.blueBright(`fanfou-streamer: ${require('fanfou-streamer/package').version}`)
    const version = `${banner}\n${nofanVersion}\n${sdkVersion}\n${streamerVersion}`
    return version
  }
}

module.exports = Nofan
