'use strict'

const fs = require('fs')
const homedir = require('homedir')
const colors = require('colors/safe')

function createNofanDir () {
  return new Promise((resolve, reject) => {
    fs.mkdir(`${homedir()}/.nofan/`, () => {
      resolve()
    })
  })
}

function createJsonFile (filename, content) {
  return new Promise((resolve, reject) => {
    const filePath = `${homedir()}/.nofan/${filename}.json`
    fs.writeFile(filePath, JSON.stringify(content, null, 2), 'utf8', (e) => {
      if (e) reject(colors.red(`create file '${filePath}' failed`))
      else resolve()
    })
  })
}

function readJsonFile (filename) {
  return new Promise((resolve, reject) => {
    const filePath = `${homedir()}/.nofan/${filename}.json`
    fs.open(filePath, 'r', (e, fd) => {
      if (e) {
        if (e.code === 'ENOENT') {
          reject(colors.red(`file '${filePath}' does not exist`))
        }
        reject(colors.red(`read file '${filePath}' failed`))
      } else resolve(require(filePath))
    })
  })
}

async function getConfig () {
  try {
    return await readJsonFile('config')
  } catch (err) {
    console.log(err)
  }
}

async function getAccount () {
  try {
    return await readJsonFile('account')
  } catch (err) {
    console.log(err)
  }
}

async function setConfig (config) {
  try {
    await createJsonFile('config', config)
  } catch (err) {
    console.log(err)
  }
}

async function setAccount (account) {
  try {
    await createJsonFile('account', account)
  } catch (err) {
    console.log(err)
  }
}

module.exports = {
  createNofanDir: createNofanDir,
  getConfig: getConfig,
  getAccount: getAccount,
  setConfig: setConfig,
  setAccount: setAccount
}
