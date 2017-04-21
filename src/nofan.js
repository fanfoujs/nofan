'use strict'

const fs = require('fs')
const colors = require('colors')
const prompt = require('prompt')
const homedir = require('homedir')
const Fanfou = require('fanfou-sdk')
const inquirer = require('inquirer')
const async = require('async')
const schema = require('./schema')
const timeago = require('timeago.js')

class Nofan {
  /**
   * command `nofan login`
   */
  static login () {
    Nofan._getConfig((e, config) => {
      prompt.message = '<nofan>'
      prompt.start()
      prompt.get(schema.login, function (e, res) {
        if (e) console.error(e)
        else {
          const ff = new Fanfou({
            auth_type: 'xauth',
            consumer_key: config.CONSUMER_KEY,
            consumer_secret: config.CONSUMER_SECRET,
            username: res.username,
            password: res.password,
          })
          ff.xauth((e, token) => {
            if (e) console.log('Login failed!'.red)
            else {
              config.USER = res.username
              async.parallel({
                config: (callback) => {
                  Nofan._createJsonFile('config', config, () => {
                    callback(null)
                  })
                },
                account: (callback) => {
                  Nofan._getAccount((e, account) => {
                    if (e) callback(e)
                    else callback(null, account)
                  })
                }
              }, (error, result) => {
                const account = result.account
                account[res.username] = {
                  CONSUMER_KEY: config.CONSUMER_KEY,
                  CONSUMER_SECRET: config.CONSUMER_SECRET,
                  OAUTH_TOKEN: token.oauth_token,
                  OAUTH_TOKEN_SECRET: token.oauth_token_secret
                }
                Nofan._createJsonFile('account', account, (e) => {
                  if (e) console.error(e)
                  else console.log('Login succeed!'.green)
                })
              })
            }
          })
        }
      })
    })
  }

  /**
   * command `nofan logout`
   */
  static logout () {
    Nofan._getConfig((e, config) => {
      if (config.hasOwnProperty('USER')) {
        Nofan._getAccount((e, account) => {
          delete account[config.USER]
          Nofan._createJsonFile('account', account, () => {
            console.log('Logout succeed!')
          })
        })
      }
    })
  }

  /**
   * command `nofan config`
   */
  static config () {
    prompt.message = '<nofan>'
    prompt.start()
    prompt.get(schema.config, function (e, res) {
      if (e) console.error(e)
      else {
        const config = {
          CONSUMER_KEY: res.consumer_key,
          CONSUMER_SECRET: res.consumer_secret,
        }
        Nofan._createJsonFile(
          'config',
          config,
          () => {
            console.log(JSON.stringify(config))
          }
        )
      }
    })
  }

  /**
   * command `nofan switch`
   */
  static switchUser () {
    Nofan._getFiles((e, config, account) => {
      const choices = []
      const currentName = config.USER
      for (const name in account) {
        if (account.hasOwnProperty(name)) {
          if (currentName === name) choices.push({name: name, disabled: 'current'.green})
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
          }
        ]).then((user) => {
          config.USER = user.username
          Nofan._createJsonFile('config', config, () => {
          })
        })
      } else {
        console.log('no more account')
      }
    })
  }

  /**
   * Show home timeline
   * @param options {object}
   */
  static homeTimeline (options) {
    options = options || {}
    const count = options.count || 10
    const time_ago = options.time_ago || false
    Nofan._get('/statuses/home_timeline', {count: count}, (e, res, obj) => {
      if (e) console.error(e)
      else {
        Nofan._displayTimeline(obj, time_ago)
      }
    })
  }

  /**
   * Show public timeline
   * @param options {object}
   */
  static publicTimeline (options) {
    options = options || {}
    const count = options.count || 10
    const time_ago = options.time_ago || false
    Nofan._get('/statuses/public_timeline', {count: count}, (e, res, obj) => {
      if (e) console.error(e)
      else {
        Nofan._displayTimeline(obj, time_ago)
      }
    })
  }

  /**
   * Post new status
   * @param text {text}
   */
  static update (text) {
    Nofan._post('/statuses/update', {status: text}, (e, res, obj) => {
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
    Nofan._get('/statuses/user_timeline', {}, (e, res, obj) => {
      if (e) console.error(e)
      else {
        Nofan._post('/statuses/destroy', {id: obj[0].id}, (e, res, obj) => {
          if (e) console.error(e)
        })
      }
    })
  }

  /**
   * command `nofan mentions`
   * @param options {number}
   */
  static mentions (options) {
    options = options || {}
    const count = options.count || 10
    const time_ago = options.time_ago || false
    Nofan._get('/statuses/mentions', {count: count}, (e, res, obj) => {
      if (e) console.error(e)
      else {
        Nofan._displayTimeline(obj, time_ago)
      }
    })
  }

  /**
   * command `nofan me`
   * @param options
   */
  static me (options) {
    options = options || {}
    const count = options.count || 10
    const time_ago = options.time_ago || false
    Nofan._get('/statuses/user_timeline', {count: count}, (e, res, obj) => {
      if (e) console.error(e)
      else {
        Nofan._displayTimeline(obj, time_ago)
      }
    })
  }

  /**
   * @param callback
   * @private
   */
  static _createNofanDir (callback) {
    fs.mkdir(homedir() + '/.nofan/', (res) => {
      callback(res)
    })
  }

  /**
   * @param filename {text}
   * @param content {object}
   * @param callback
   * @private
   */
  static _createJsonFile (filename, content, callback) {
    Nofan._createNofanDir(() => {
      fs.writeFile(`${homedir()}/.nofan/${filename}.json`, JSON.stringify(content, null, 2), 'utf8', (e) => {
        if (e) callback(e)
        else callback(null)
      })
    })
  }

  /**
   * @param callback
   * @private
   */
  static _getConfig (callback) {
    fs.open(homedir() + '/.nofan/config.json', 'r', (e, fd) => {
      if (e) {
        if (e.code === 'ENOENT') {
          console.error(`file '${homedir()}/.nofan/config.json' does not exist`.red)
          console.log(`use 'nofan --help' list available commands`)
          return
        }
        throw e
      }
      else callback(null, require(`${homedir()}/.nofan/config`))
    })
  }

  /**
   * @param callback
   * @private
   */
  static _getAccount (callback) {
    fs.open(homedir() + '/.nofan/account.json', 'r', (e, fd) => {
      if (e) {
        if (e.code === 'ENOENT') {
          Nofan._createJsonFile('account', {}, () => {
            callback(null, require(`${homedir()}/.nofan/account`))
          })
        }
        else throw e
      }
      else callback(null, require(`${homedir()}/.nofan/account`))
    })
  }

  /**
   * @param uri {text}
   * @param params {object}
   * @param callback
   * @private
   */
  static _get (uri, params, callback) {
    Nofan._getFiles((e, config, account) => {
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
      Nofan._createJsonFile('config', config, () => {
      })
      const ff = new Fanfou({
        auth_type: 'oauth',
        consumer_key: user.CONSUMER_KEY,
        consumer_secret: user.CONSUMER_SECRET,
        oauth_token: user.OAUTH_TOKEN,
        oauth_token_secret: user.OAUTH_TOKEN_SECRET,
      })
      ff.get(uri, params, (e, res, obj) => {
        callback(e, res, obj)
      })
    })
  }

  /**
   * @param uri {text}
   * @param params {object}
   * @param callback
   * @private
   */
  static _post (uri, params, callback) {
    Nofan._getFiles((e, config, account) => {
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
      Nofan._createJsonFile('config', config, () => {
      })
      const ff = new Fanfou({
        auth_type: 'oauth',
        consumer_key: user.CONSUMER_KEY,
        consumer_secret: user.CONSUMER_SECRET,
        oauth_token: user.OAUTH_TOKEN,
        oauth_token_secret: user.OAUTH_TOKEN_SECRET,
      })
      ff.post(uri, params, (e, res, obj) => {
        callback(e, res, obj)
      })
    })
  }

  /**
   *
   * @param path {text}
   * @param status {text}
   * @param callback
   * @private
   */
  static _upload (path, status, callback) {
    Nofan._getFiles((e, config, account) => {
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
      Nofan._createJsonFile('config', config, () => {
      })
      const ff = new Fanfou({
        auth_type: 'oauth',
        consumer_key: user.CONSUMER_KEY,
        consumer_secret: user.CONSUMER_SECRET,
        oauth_token: user.OAUTH_TOKEN,
        oauth_token_secret: user.OAUTH_TOKEN_SECRET,
      })
      fs.open(path, 'r', (e, fd) => {
        if (e) {
          if (e.code === 'ENOENT') {
            console.error(`file '${path}' does not exist`.red)
          }
          else throw e
        }
        else {
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
    })
  }

  /**
   * @param callback
   * @private
   */
  static _getFiles (callback) {
    async.parallel({
      config: (cb) => {
        Nofan._getConfig(cb)
      },
      account: (cb) => {
        Nofan._getAccount(cb)
      }
    }, (e, res) => {
      if (e) callback(e)
      else {
        const config = res.config
        const account = res.account
        callback(null, config, account)
      }
    })
  }

  /**
   * @param timeline {object}
   * @param time_ago {bool}
   * @private
   */
  static _displayTimeline (timeline, time_ago) {
    time_ago = time_ago || false
    for (let i = 0; i < timeline.length; i++) {
      const status = timeline[i]
      let text = status.text
      let ats = status.text.match(/@([\u4E00-\u9FA5\uF900-\uFA2D\w\.]+)/g)
      if (ats === null) ats = []
      ats.forEach((v) => {
        text = text.replace(eval(`/${v}/g`), v.blue)
      })
      let photo_url = ''
      const status_time_ago = `(${new timeago().format(status.created_at)})`.green
      // if (status.hasOwnProperty('photo')) photo_url = ` ${status.photo.originurl}`.blue;
      if (!time_ago) console.log(`[${status.user.name.green}] ${text}${photo_url}`)
      else console.log(`[${status.user.name.green}] ${text}${photo_url} ` + status_time_ago)
    }
  }
}

module.exports = Nofan
