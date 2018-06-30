#!/usr/bin/env node
'use strict'

const fs = require('fs')
const importLazy = require('import-lazy')(require)

const gradient = importLazy('gradient-string')
const chalkPipe = importLazy('chalk-pipe')
const TimeAgo = importLazy('timeago.js')
const Fanfou = importLazy('fanfou-sdk')
const inquirer = importLazy('inquirer')
const figlet = importLazy('figlet')
const boxen = importLazy('boxen')
const chalk = importLazy('chalk')
const pangu = importLazy('pangu')
const ora = importLazy('ora')
const util = importLazy('./util')
const colorsPrompt = importLazy('./prompts/colors')
const configPrompt = importLazy('./prompts/config')
const loginPrompt = importLazy('./prompts/login')
const switchPrompt = importLazy('./prompts/switch')
const trendsPrompt = importLazy('./prompts/trends')
const replyPrompt = importLazy('./prompts/reply')

class Nofan {
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
        if (e) {
          process.spinner.fail(pangu.spacing(e.message))
          process.exit(1)
        } else {
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
      const user = await inquirer.prompt(loginPrompt({hasName: Boolean(username)}))
      if (username) {
        user.username = username
      }
      process.spinner = ora('Logging in').start()
      login(user.username, user.password)
    }
  }

  static async logout () {
    process.spinner = ora('Logging out').start()
    const config = await util.getConfig()
    if (config.USER) {
      const account = await util.getAccount()
      delete account[config.USER]
      await util.setAccount(account)
      process.spinner.succeed('Logout succeed!')
    }
  }

  static async config (key, secret, showAll) {
    const config = await util.getConfig()
    if (key && secret) {
      config.CONSUMER_KEY = key
      config.CONSUMER_SECRET = secret
      await util.createNofanDir()
      await util.setConfig(config)
    } else {
      const settings = await inquirer.prompt(configPrompt(config, showAll))
      config.CONSUMER_KEY = settings.key || ''
      config.CONSUMER_SECRET = settings.secret || ''
      config.DISPLAY_COUNT = settings.display_count
      config.TIME_TAG = settings.display.indexOf('time_tag') !== -1
      config.PHOTO_TAG = settings.display.indexOf('photo_tag') !== -1
      config.SSL = settings.display.indexOf('use_https') !== -1
      if (settings.api_domain) {
        config.API_DOMAIN = settings.api_domain
      }
      if (settings.oauth_domain) {
        config.OAUTH_DOMAIN = settings.oauth_domain
      }
      if (settings.https) {
        config.FAKE_HTTPS = settings.https.indexOf('fake_https') !== -1
      }
      await util.createNofanDir()
      await util.setConfig(config)
    }
  }

  static async colors () {
    const config = await util.getConfig()
    config.COLORS = config.COLORS || {}
    const paints = await inquirer.prompt(colorsPrompt(config))
    const colors = {...paints}
    config.COLORS = colors
    await util.createNofanDir()
    await util.setConfig(config)
  }

  static async switchUser (id) {
    const [config, account] = [
      await util.getConfig(),
      await util.getAccount()
    ]
    if (id) {
      if (account[id]) {
        config.USER = id
        await util.setConfig(config)
        process.spinner = ora().succeed(`Switch account to ${chalk.blue.bold(id)}`)
      } else {
        process.spinner = ora().info(`${chalk.blue.bold(id)} needs login`)
        process.exit(1)
      }
    } else {
      const currentName = config.USER
      const choices = Object.keys(account).map(name => {
        if (name === currentName) {
          return ({name, disabled: chalk.green('current')})
        }
        return name
      })
      if (choices.length > 1) {
        const user = await inquirer.prompt(switchPrompt(choices))
        config.USER = user.username
        await util.setConfig(config)
      } else {
        process.spinner = ora().info('No more account')
        process.exit(1)
      }
    }
  }

  static async homeTimeline (options) {
    const {count, timeAgo, noPhotoTag, reply} = await Nofan.getConfig(options)
    const statuses = await Nofan._get('/statuses/home_timeline', {count, format: 'html'})
    Nofan._displayTimeline(statuses, timeAgo, noPhotoTag, reply)
  }

  static async publicTimeline (options) {
    const {count, timeAgo, noPhotoTag} = await Nofan.getConfig(options)
    const statuses = await Nofan._get('/statuses/public_timeline', {count, format: 'html'})
    Nofan._displayTimeline(statuses, timeAgo, noPhotoTag)
  }

  static async searchTimeline (q, options) {
    const {count, timeAgo, noPhotoTag} = await Nofan.getConfig(options)
    const statuses = await Nofan._get('/search/public_timeline', {q, count, format: 'html'})
    Nofan._displayTimeline(statuses, timeAgo, noPhotoTag)
  }

  static async trendsTimeline (options) {
    options = options || {}
    const [{trends: hotTrends}, savedTrends] = [
      await Nofan._get('/trends/list'),
      await Nofan._get('/saved_searches/list')
    ]
    if (hotTrends.length + savedTrends.length > 0) {
      process.spinner.stop()
      const {trends: trend} = await inquirer.prompt(trendsPrompt(hotTrends, savedTrends))
      process.spinner.start('Fetching')
      await Nofan.searchTimeline(trend, options)
    } else {
      process.spinner.fail('No trends exist')
      process.exit(1)
    }
  }

  static async getConfig (options) {
    options = options || {}
    process.NOFAN_CONFIG = await util.getConfig()
    const count = options.count || process.NOFAN_CONFIG.DISPLAY_COUNT || 10
    const timeAgo = options.time_ago || false
    const noPhotoTag = options.no_photo_tag || false
    const reply = options.reply || false
    return {
      count,
      timeAgo,
      noPhotoTag,
      reply
    }
  }

  static async update (text) {
    await Nofan._post('/statuses/update', {status: text})
    process.spinner.succeed('Sent!')
  }

  static async upload (path, text) {
    await Nofan._upload(path, text)
    process.spinner.succeed('Sent!')
  }

  static async undo () {
    const statuses = await Nofan._get('/statuses/user_timeline', {})
    await Nofan._post('/statuses/destroy', {id: statuses[0].id})
    process.spinner.succeed('Deleted!')
  }

  static async mentions (options) {
    const {count, timeAgo, noPhotoTag, reply} = await Nofan.getConfig(options)
    const statuses = await Nofan._get('/statuses/mentions', {count, format: 'html'})
    Nofan._displayTimeline(statuses, timeAgo, noPhotoTag, reply)
  }

  static async me (options) {
    const {count, timeAgo, noPhotoTag} = await Nofan.getConfig(options)
    const statuses = await Nofan._get('/statuses/user_timeline', {count, format: 'html'})
    Nofan._displayTimeline(statuses, timeAgo, noPhotoTag)
  }

  static async _get (uri, params) {
    const config = process.NOFAN_CONFIG ? process.NOFAN_CONFIG : await util.getConfig()
    const account = await util.getAccount()
    let user = account[config.USER]
    if (!user) {
      for (const name in account) {
        if (account.name) {
          user = account[name]
          config.USER = name
          break
        }
      }
      if (!user) {
        process.spinner.fail('Not logged in')
        process.exit(1)
      }
    }
    util.setConfig(config)
    const ff = Nofan.initFanfou(user, config)

    return new Promise(resolve => {
      ff.get(uri, params, (err, res) => {
        const expectHttpsError = /Invalid signature\. Expected basestring is GET&http%3A%2F%2F/
        if (
          config.SSL &&
          !config.FAKE_HTTS &&
          err &&
          typeof err.message === 'string' &&
          err.message.match(expectHttpsError)
        ) {
          const tip = `Please try ${chalk.green('`nofan config -a`')} to switch ${chalk.green('`fake_https`')} on`
          err.message += `\n\n${boxen(tip, {padding: 1})}`
        }
        if (err) {
          process.spinner.fail(pangu.spacing(err.message))
          process.exit(1)
        }
        resolve(res)
      })
    })
  }

  static async _post (uri, params) {
    const config = process.NOFAN_CONFIG ? process.NOFAN_CONFIG : await util.getConfig()
    const account = await util.getAccount()
    let user = account[config.USER]
    if (!user) {
      for (const name in account) {
        if (account.name) {
          user = account[name]
          config.USER = name
          break
        }
      }
      if (!user) {
        process.spinner.fail('Not logged in')
        process.exit(1)
      }
    }
    util.setConfig(config)
    const ff = Nofan.initFanfou(user, config)
    return new Promise(resolve => {
      ff.post(uri, params, (err, res) => {
        const expectHttpsError = /Invalid signature\. Expected basestring is POST&http%3A%2F%2F/
        if (
          config.SSL &&
          !config.FAKE_HTTS &&
          err &&
          typeof err.message === 'string' &&
          err.message.match(expectHttpsError)
        ) {
          const tip = `Please try ${chalk.green('`nofan config -a`')} to switch ${chalk.green('`fake_https`')} on`
          err.message += `\n\n${boxen(tip, {padding: 1})}`
        }
        if (err) {
          process.spinner.fail(pangu.spacing(err.message))
          process.exit(1)
        }
        resolve(res)
      })
    })
  }

  static async _upload (path, status) {
    const config = process.NOFAN_CONFIG ? process.NOFAN_CONFIG : await util.getConfig()
    const account = await util.getAccount()
    let user = account[config.USER]
    if (!user) {
      for (const name in account) {
        if (account.name) {
          user = account[name]
          config.USER = name
          break
        }
      }
      if (!user) {
        process.spinner.fail('Not logged in')
        process.exit(1)
      }
    }
    util.setConfig(config)
    const ff = Nofan.initFanfou(user, config)
    return new Promise(resolve => {
      fs.open(path, 'r', err => {
        if (err) {
          if (err.code === 'ENOENT') {
            process.spinner.fail(`file '${path}' does not exist`)
          } else {
            process.spinner.fail(err.message)
          }
          process.exit(1)
        } else {
          ff.up('/photos/upload', {photo: fs.createReadStream(path), status}, (err, res) => {
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
              process.spinner.fail(pangu.spacing(err.message))
              process.exit(1)
            } else {
              resolve(res)
            }
          })
        }
      })
    })
  }

  static async _renderTimeline (timeline, timeAgoTag, noPhotoTag) {
    const config = process.NOFAN_CONFIG
    if (process.spinner) {
      process.spinner.stop()
    }
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
          if (keyword.bold) {
            return chalkPipe(`${style}.${highlightColor}`)(keyword.text)
          }
          return chalkPipe(style)(keyword.text)
        }).join('')
      }
      return false
    }
    const renderStatus = status => {
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
        if (text.length > 0) {
          text += ` ${photoTag}`
        } else {
          text += photoTag
        }
      }
      if (timeAgoTag) {
        const statusTimeAgo = chalkPipe(timeagoColor)(`(${new TimeAgo().format(status.created_at)})`)
        return {name: `${name} ${text} ${statusTimeAgo}`, value: status}
      }
      return {name: `${name} ${text}`, value: status}
    }
    return timeline.map(renderStatus)
  }

  static async _replyList (renderedTL) {
    inquirer.prompt(replyPrompt.replyPrompt(renderedTL))
      .then(selectedStatus => {
        let text = '@' + selectedStatus.status.user.name + ' '
        const config = process.NOFAN_CONFIG
        const colors = config.COLORS || {}
        const atColor = colors.at || 'blue'
        const textColor = colors.text
        if (selectedStatus.replyType === 'Reply') {
          inquirer.prompt(replyPrompt.replyInputPrompt('Enter your reply...to ' + chalkPipe(atColor)(text)))
            .then(reply => {
              this.update(text + reply.content)
            })
        } else if (selectedStatus.replyType === 'Repost') {
          selectedStatus.status.txt.forEach(item => {
            text = (item.type === 'at') ? (text + '@' + item.name) : (text + item._text)
          })
          inquirer.prompt(replyPrompt.replyInputPrompt('Enter your repost content...to ' + chalkPipe(textColor)(text)))
            .then(reply => {
              this.update(reply.content.trim() + ' 转' + text)
            })
        } else {
          process.exit()
        }
      })
  }

  static async _displayTimeline (timeline, timeAgoTag, noPhotoTag, reply) {
    const renderedTL = await this._renderTimeline(timeline, timeAgoTag, noPhotoTag)
    if (reply) {
      this._replyList(renderedTL)
    } else {
      renderedTL.forEach(status => {
        console.log(status.name)
      })
    }
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
