'use strict'

const fs = require('fs')
const colors = require('colors/safe')
const prompt = require('prompt')
const Fanfou = require('fanfou-sdk')
const inquirer = require('inquirer')
const schema = require('./schema')
const TimeAgo = require('timeago.js')
const util = require('./util')

class Nofan {
  /**
   * command `nofan login`
   */
  static async login () {
    const config = await util.getConfig()
    prompt.message = '<nofan>'
    prompt.start()
    prompt.get(schema.login, async (e, res) => {
      if (e) console.error(e)
      else {
        const ff = new Fanfou({
          auth_type: 'xauth',
          consumer_key: config.CONSUMER_KEY,
          consumer_secret: config.CONSUMER_SECRET,
          username: res.username,
          password: res.password
        })
        ff.xauth(async (e, token) => {
          if (e) console.log(colors.red('Login failed!'))
          else {
            config.USER = res.username
            await util.setConfig(config)
            const account = await util.getAccount()
            account[res.username] = {
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
    })
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
      console.log('Logout succeed!')
    }
  }

  /**
   * command `nofan config`
   */
  static config () {
    prompt.message = '<nofan>'
    prompt.start()
    prompt.get(schema.config, async (e, res) => {
      if (e) console.error(e)
      else {
        const config = {
          CONSUMER_KEY: res.consumer_key,
          CONSUMER_SECRET: res.consumer_secret
        }
        await util.createNofanDir()
        await util.setConfig(config)
      }
    })
  }

  /**
   * command `nofan switch`
   */
  static async switchUser () {
    const config = await util.getConfig()
    const account = await util.getAccount()
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
          choices: choices
        }
      ]).then(async user => {
        config.USER = user.username
        await util.setConfig(config)
      })
    } else {
      console.log('no more account')
    }
  }

  /**
   * Show home timeline
   */
  static homeTimeline (options) {
    options = options || {}
    const count = options.count || 10
    const timeAgo = options.time_ago || false
    const noPhotoTag = options.no_photo_tag || false
    Nofan._get('/statuses/home_timeline', {count: count, format: 'html'}, (e, statuses) => {
      if (e) console.error(e)
      else {
        Nofan._displayTimeline(statuses, timeAgo, noPhotoTag)
      }
    })
  }

  /**
   * Show public timeline
   */
  static publicTimeline (options) {
    options = options || {}
    const count = options.count || 10
    const timeAgo = options.time_ago || false
    const noPhotoTag = options.no_photo_tag || false
    Nofan._get('/statuses/public_timeline', {count: count, format: 'html'}, (e, statuses) => {
      if (e) console.error(e)
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
      if (e) console.log(e)
    })
  }

  /**
   * Post new status with photo
   * @param path
   * @param text
   */
  static upload (path, text) {
    Nofan._upload(path, text, (e) => {
      if (e) console.log(e)
    })
  }

  /**
   * command `nofan undo`
   */
  static undo () {
    Nofan._get('/statuses/user_timeline', {}, (e, statuses) => {
      if (e) console.error(e)
      else {
        Nofan._post('/statuses/destroy', {id: statuses[0].id}, (e) => {
          if (e) console.error(e)
        })
      }
    })
  }

  /**
   * command `nofan mentions`
   */
  static mentions (options) {
    options = options || {}
    const count = options.count || 10
    const timeAgo = options.time_ago || false
    const noPhotoTag = options.no_photo_tag || false
    Nofan._get('/statuses/mentions', {count: count, format: 'html'}, (e, statuses) => {
      if (e) console.error(e)
      else {
        Nofan._displayTimeline(statuses, timeAgo, noPhotoTag)
      }
    })
  }

  /**
   * command `nofan me`
   */
  static me (options) {
    options = options || {}
    const count = options.count || 10
    const timeAgo = options.time_ago || false
    const noPhotoTag = options.no_photo_tag || false
    Nofan._get('/statuses/user_timeline', {count: count, format: 'html'}, (e, statuses) => {
      if (e) console.error(e)
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
      oauth_token_secret: user.OAUTH_TOKEN_SECRET
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
      oauth_token_secret: user.OAUTH_TOKEN_SECRET
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
      oauth_token_secret: user.OAUTH_TOKEN_SECRET
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

  static _displayTimeline (timeline, timeAgoTag, noPhotoTag) {
    timeAgoTag = timeAgoTag || false
    noPhotoTag = noPhotoTag || false
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
}

module.exports = Nofan
