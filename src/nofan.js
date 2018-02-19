'use strict'

const gradient = require('gradient-string')
const chalkPipe = require('chalk-pipe')
const TimeAgo = require('timeago.js')
const Fanfou = require('fanfou-sdk')
const inquirer = require('inquirer')
const figlet = require('figlet')
const boxen = require('boxen')
const util = require('./util')
const chalk = require('chalk')
const pangu = require('pangu')
const ora = require('ora')
const fs = require('fs')

inquirer.registerPrompt('color-input', require('inquirer-chalk-pipe'))

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
        oauth_domain: config.OAUTH_DOMAIN,
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
      ]).then(user => {
        username = user.username
        password = user.password
        process.spinner = ora('Logging in').start()
        login(user.username, user.password)
      })
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
      inquirer.prompt(promptList).then(async settings => {
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
      })
    }
  }

  /**
   * command `nofan colors`
   */
  static async colors () {
    const config = await util.getConfig()
    config.COLORS = config.COLORS || {}
    const promptList = [
      {
        type: 'color-input',
        name: 'text',
        message: 'Text color',
        default: config.COLORS.text || ''
      }, {
        type: 'color-input',
        name: 'name',
        message: 'Name color',
        default: config.COLORS.name || 'green'
      }, {
        type: 'color-input',
        name: 'at',
        message: 'ATs color',
        default: config.COLORS.at || 'blue'
      }, {
        type: 'color-input',
        name: 'link',
        message: 'Link color',
        default: config.COLORS.link || 'blue'
      }, {
        type: 'color-input',
        name: 'tag',
        message: 'Tag color',
        default: config.COLORS.tag || 'blue'
      }, {
        type: 'color-input',
        name: 'photo',
        message: 'Photo color',
        default: config.COLORS.photo || 'blue'
      }, {
        type: 'color-input',
        name: 'timeago',
        message: 'Timeago color',
        default: config.COLORS.timeago || 'green'
      }
    ]
    inquirer.prompt(promptList).then(async paints => {
      const colors = {}
      colors.text = paints.text
      colors.name = paints.name
      colors.at = paints.at
      colors.link = paints.link
      colors.tag = paints.tag
      colors.photo = paints.photo
      colors.timeago = paints.timeago
      config.COLORS = colors
      await util.createNofanDir()
      await util.setConfig(config)
    })
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
          if (currentName === name) choices.push({name: name, disabled: chalk.green('current')})
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
    Nofan._get('/statuses/home_timeline', {count: count, format: 'html'}, (e, statuses) => {
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
    Nofan._get('/statuses/public_timeline', {count: count, format: 'html'}, (e, statuses) => {
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
    Nofan._get('/statuses/mentions', {count: count, format: 'html'}, (e, statuses) => {
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
    Nofan._get('/statuses/user_timeline', {count: count, format: 'html'}, (e, statuses) => {
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
    const ff = new Fanfou({
      auth_type: 'oauth',
      consumer_key: user.CONSUMER_KEY,
      consumer_secret: user.CONSUMER_SECRET,
      oauth_token: user.OAUTH_TOKEN,
      oauth_token_secret: user.OAUTH_TOKEN_SECRET,
      protocol: config.SSL ? 'https:' : 'http:',
      api_domain: config.API_DOMAIN,
      oauth_domain: config.OAUTH_DOMAIN,
      fakeHttps: config.FAKE_HTTPS
    })
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
    const ff = new Fanfou({
      auth_type: 'oauth',
      consumer_key: user.CONSUMER_KEY,
      consumer_secret: user.CONSUMER_SECRET,
      oauth_token: user.OAUTH_TOKEN,
      oauth_token_secret: user.OAUTH_TOKEN_SECRET,
      protocol: config.SSL ? 'https:' : 'http:',
      api_domain: config.API_DOMAIN,
      oauth_domain: config.OAUTH_DOMAIN,
      fakeHttps: config.FAKE_HTTPS || false
    })
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
    const ff = new Fanfou({
      auth_type: 'oauth',
      consumer_key: user.CONSUMER_KEY,
      consumer_secret: user.CONSUMER_SECRET,
      oauth_token: user.OAUTH_TOKEN,
      oauth_token_secret: user.OAUTH_TOKEN_SECRET,
      protocol: config.SSL ? 'https:' : 'http:',
      api_domain: config.API_DOMAIN,
      oauth_domain: config.OAUTH_DOMAIN,
      fakeHttps: config.FAKE_HTTPS || false
    })
    fs.open(path, 'r', (e, fd) => {
      if (e) {
        if (e.code === 'ENOENT') {
          process.spinner.fail(`file '${path}' does not exist`)
        } else throw e
      } else {
        ff.upload(
          fs.createReadStream(path),
          status,
          (e) => {
            if (e) {
              const expectHttpError = /Invalid signature\. Expected basestring is POST&http%3A%2F%2F/
              const expectHttpsError = /Invalid signature\. Expected basestring is POST&https%3A%2F%2F/
              if (
                config.SSL &&
                !config.FAKE_HTTS &&
                e &&
                typeof e.message === 'string' &&
                e.message.match(expectHttpError)
              ) {
                const tip = `Please try ${chalk.green('`nofan config -a`')} to switch ${chalk.green('`fake_https`')} on`
                e.message += `\n\n${boxen(tip, {padding: 1})}`
              } else if (
                config.SSL &&
                config.FAKE_HTTPS &&
                e &&
                typeof e.message === 'string' &&
                e.message.match(expectHttpsError)
              ) {
                const tip = `Please try ${chalk.green('`nofan config -a`')} to switch ${chalk.green('`fake_https`')} off`
                e.message += `\n\n${boxen(tip, {padding: 1})}`
              }
              callback(e)
            } else callback(null)
          }
        )
      }
    })
  }

  static async _displayTimeline (timeline, timeAgoTag, noPhotoTag) {
    const config = process.NOFAN_CONFIG

    if (process.spinner) process.spinner.stop()
    timeAgoTag = timeAgoTag || config.TIME_TAG
    noPhotoTag = noPhotoTag || !config.PHOTO_TAG

    const colors = config.COLORS || {}
    const nameColor = chalkPipe(`green.${colors.name}`)
    const textColor = chalkPipe(colors.text)
    const atColor = chalkPipe(`blue.${colors.at}`)
    const linkColor = chalkPipe(`blue.${colors.link}`)
    const tagColor = chalkPipe(`blue.${colors.tag}`)
    const photoColor = chalkPipe(`blue.${colors.photo}`)
    const timeagoColor = chalkPipe(`green.${colors.timeago}`)

    timeline.forEach(status => {
      let text = ''
      status.txt.forEach(item => {
        switch (item.type) {
          case 'at':
            text += atColor(item.text)
            break
          case 'link':
            text += linkColor(item.text)
            break
          case 'tag':
            text += tagColor(item._text)
            break
          default:
            text += textColor(item._text)
            break
        }
      })

      const name = textColor('[') + nameColor(status.user.name) + textColor(']')

      if (status.photo && !noPhotoTag) {
        const photoTag = photoColor('[图]')
        if (text.length) text += ` ${photoTag}`
        else text += photoTag
      }

      if (!timeAgoTag) {
        console.log(`${name} ${text}`)
      } else {
        const statusTimeAgo = timeagoColor(`(${new TimeAgo().format(status.created_at)})`)
        console.log(`${name} ${text} ${statusTimeAgo}`)
      }
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
