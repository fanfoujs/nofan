#!/usr/bin/env node

const Nofan = require('../lib/nofan')
const program = require('commander')
const ora = require('ora')
const updateNotifier = require('update-notifier')
const pkg = require('../package')

updateNotifier({pkg}).notify()

program
  .option('-v, --version', 'output the version info')
  .option('-t, --time', 'show time ago tag')
  .option('--no-photo-tag', 'hide photo tag')
  .version(Nofan.version())

program
  .command('config [consumer_key] [consumer_secret]')
  .option('-a, --all', 'show all config')
  .description('config consumer key and consumer secret')
  .action(function (key, secret, options) {
    const showAll = options.all
    Nofan.config(key, secret, showAll)
  })

program
  .command('colors')
  .description('customize color style')
  .action(function () {
    Nofan.colors()
  })

program
  .command('login [username] [password]')
  .description('login nofan')
  .action(function (username, password) {
    Nofan.login(username, password)
  })

program
  .command('logout')
  .description('logout nofan')
  .action(function () {
    Nofan.logout()
  })

program
  .command('switch [id]')
  .alias('s')
  .description('switch account')
  .action(function (id) {
    Nofan.switchUser(id)
  })

program
  .command('home [count]')
  .alias('h')
  .description('show home timeline')
  .action(function (count, options) {
    process.spinner = ora('Fetching').start()
    Nofan.homeTimeline({
      count: count,
      time_ago: options.parent.time,
      no_photo_tag: !options.parent.photoTag
    })
  })

program
  .command('mentions [count]')
  .alias('m')
  .description('show mentions')
  .action(function (count, options) {
    process.spinner = ora('Fetching').start()
    Nofan.mentions({
      count: count,
      time_ago: options.parent.time,
      no_photo_tag: !options.parent.photoTag
    })
  })

program
  .command('me [count]')
  .description('show my statuses')
  .action(function (count, options) {
    process.spinner = ora('Fetching').start()
    Nofan.me({
      count: count,
      time_ago: options.parent.time,
      no_photo_tag: !options.parent.photoTag
    })
  })

program
  .command('public [count]')
  .alias('p')
  .description('show public timeline')
  .action(function (count, options) {
    process.spinner = ora('Fetching').start()
    Nofan.publicTimeline({
      count: count,
      time_ago: options.parent.time,
      no_photo_tag: !options.parent.photoTag
    })
  })

program
  .command('undo')
  .description('delete last status')
  .action(function () {
    process.spinner = ora('Deleting').start()
    Nofan.undo()
  })

program
  .arguments('<status> [more...]')
  .option('-p, --photo <path>', 'attach a photo')
  .description('')
  .action(function (pre, more, options) {
    process.spinner = ora('Sending').start()
    more.unshift(pre)
    const text = more.join(' ')
    if (!options.photo) Nofan.update(text)
    else Nofan.upload(options.photo, text)
  })

program.parse(process.argv)

if (program.args.length === 0) {
  process.spinner = ora('Fetching').start()
  Nofan.homeTimeline({
    time_ago: program.time,
    no_photo_tag: !program.photoTag
  })
}
