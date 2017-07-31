'use strict'

const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const homedir = require('homedir')
const cssColorNames = require('css-color-names')

const isProduction = !fs.existsSync(path.join(__dirname, '../src'))

let configPath = ''
isProduction ? configPath = '/.nofan/' : configPath = '/.nofan-dev/'

function createNofanDir () {
  return new Promise((resolve, reject) => {
    fs.mkdir(`${homedir()}${configPath}`, () => {
      resolve()
    })
  })
}

function createJsonFile (filename, content) {
  return new Promise((resolve, reject) => {
    const filePath = `${homedir()}${configPath}${filename}.json`
    fs.writeFile(filePath, JSON.stringify(content, null, 2), 'utf8', (e) => {
      if (e) reject(chalk.red(`create file '${filePath}' failed`))
      else resolve()
    })
  })
}

function readJsonFile (filename) {
  return new Promise((resolve, reject) => {
    const filePath = `${homedir()}${configPath}${filename}.json`
    fs.open(filePath, 'r', (e, fd) => {
      if (e) {
        if (e.code === 'ENOENT') {
          reject(chalk.red(`file '${filePath}' does not exist`))
        }
        reject(chalk.red(`read file '${filePath}' failed`))
      } else resolve(require(filePath))
    })
  })
}

function readSDKVersion (callback) {
  let version = ''
  try {
    version = require('../node_modules/fanfou-sdk/package').version
  } catch (err) {
    version = require('../package').dependencies['fanfou-sdk']
  }
  return version
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
        timeago: 'green'
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

function normalColor (name) {
  const colorMatch = name.match(`^(${[
    'black',
    'red',
    'green',
    'yellow',
    'blue',
    'magenta',
    'cyan',
    'white',
    'gray',
    'redBright',
    'greenBright',
    'yellowBright',
    'blueBright',
    'magentaBright',
    'cyanBright',
    'whiteBright'
  ].join('|')})$`)
  if (colorMatch) return colorMatch[0]
  return false
}

function parseStyle (text, stylePipe) {
  if (!stylePipe || stylePipe.length === 0) return text

  const styles = stylePipe.split('.')
  let paint = chalk
  styles.forEach(style => {
    const modifier = style.match(/^(resest|bold|dim|italic|underline|inverse|hidded|strikethrough)$/)
    const hexColor = style.match(/^#[0-9A-Fa-f]{6}$/)
    const normalColors = normalColor(style)
    const cssColor = cssColorNames[style]
    if (modifier) paint = paint[modifier[0]]
    if (hexColor) paint = paint.hex(hexColor[0])
    if (normalColors) paint = paint[normalColors]
    else if (cssColor) paint = paint.keyword(style)
  })
  return paint(text)
}

function validStyle (stylePipe) {
  if (!stylePipe || stylePipe.length === 0) return false
  const styles = stylePipe.split('.')
  let isValid = false
  styles.forEach(style => {
    const modifier = style.match(/^(resest|bold|dim|italic|underline|inverse|hidded|strikethrough)$/)
    const hexColor = style.match(/^#[0-9A-Fa-f]{6}$/)
    const normalColors = normalColor(style)
    const cssColor = cssColorNames[style]
    if (modifier || hexColor || normalColors || cssColor) isValid = true
  })
  return isValid
}

module.exports = {
  createNofanDir: createNofanDir,
  getConfig: getConfig,
  getAccount: getAccount,
  setConfig: setConfig,
  setAccount: setAccount,
  sdkVersion: readSDKVersion,
  parseStyle: parseStyle,
  validStyle: validStyle
}
