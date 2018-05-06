'use strict'

const path = require('path')
const pm2 = require('pm2')

const connect = () => {
  return new Promise(resolve => {
    pm2.connect(err => {
      if (err) {
        process.spinner.fail(err.message)
      } else {
        resolve()
      }
    })
  })
}

const start = async () => {
  await connect()

  pm2.start({
    script: path.join(__dirname, 'notifier.js'),
    name: 'nofan-notifier',
    watch: true
  }, err => {
    if (err) {
      process.spinner.fail(err.message)
    } else {
      process.spinner.succeed('Nofan Notifier started!')
    }
    pm2.disconnect()
  })
}

const stop = async () => {
  await connect()

  pm2.stop('nofan-notifier', err => {
    if (err) {
      process.spinner.fail(err.message)
    } else {
      process.spinner.succeed('Nofan Notifier stoped!')
    }
    pm2.disconnect()
  })
}

const restart = async () => {
  await connect()

  pm2.restart('nofan-notifier', err => {
    if (err) {
      process.spinner.fail(err.message)
    } else {
      process.spinner.succeed('Nofan Notifier restarted!')
    }
    pm2.disconnect()
  })
}

const deleting = async () => {
  await connect()

  pm2.delete('nofan-notifier', err => {
    if (err) {
      process.spinner.fail(err.message)
    } else {
      process.spinner.succeed('Nofan Notifier deleted!')
    }
    pm2.disconnect()
  })
}

module.exports = {
  start,
  stop,
  restart,
  deleting
}
