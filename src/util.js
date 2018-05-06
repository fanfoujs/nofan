'use strict'

const fs = require('fs')
const importLazy = require('import-lazy')(require)

const chalk = importLazy('chalk')
const homedir = importLazy('homedir')

const configPath = process.env.NODE_ENV === 'test' ? '/.nofan-test/' : '/.nofan/'

function createNofanDir () {
  return new Promise(resolve => {
    fs.mkdir(`${homedir()}${configPath}`, () => {
      resolve()
    })
  })
}

function createJsonFile (filename, content) {
  return new Promise((resolve, reject) => {
    const filePath = `${homedir()}${configPath}${filename}.json`
    fs.writeFile(filePath, JSON.stringify(content, null, 2), 'utf8', e => {
      if (e) {
        reject(chalk.red(`create file '${filePath}' failed`))
      } else {
        resolve()
      }
    })
  })
}

function readJsonFile (filename) {
  return new Promise((resolve, reject) => {
    const filePath = `${homedir()}${configPath}${filename}.json`
    fs.open(filePath, 'r', err => {
      if (err) {
        if (err.code === 'ENOENT') {
          reject(chalk.red(`file '${filePath}' does not exist`))
        }
        reject(chalk.red(`read file '${filePath}' failed`))
      } else {
        resolve(require(filePath))
      }
    })
  })
}

function readSDKVersion () {
  return require('fanfou-sdk/package').version
}

async function getConfig () {
  try {
    return await readJsonFile('config')
  } catch (err) {
    return {
      DISPLAY_COUNT: 10,
      TIME_TAG: false,
      PHOTO_TAG: true,
      SSL: false,
      API_DOMAIN: 'api.fanfou.com',
      OAUTH_DOMAIN: 'fanfou.com',
      FAKE_HTTPS: false,
      COLORS: {
        name: 'green',
        text: '',
        at: 'blue',
        link: 'blue',
        tag: 'blue',
        photo: 'blue',
        timeago: 'green',
        highlight: 'bold'
      }
    }
  }
}

async function getAccount () {
  try {
    return await readJsonFile('account')
  } catch (err) {
    return {}
  }
}

function setConfig (config) {
  createJsonFile('config', config)
}

function setAccount (account) {
  createJsonFile('account', account)
}

module.exports = {
  createNofanDir,
  getConfig,
  getAccount,
  setConfig,
  setAccount,
  sdkVersion: readSDKVersion
}
