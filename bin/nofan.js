#!/usr/bin/env node

const program = require('commander')
const importLazy = require('import-lazy')(require)

const ora = importLazy('ora')
const updateNotifier = importLazy('update-notifier')
const pkg = importLazy('../package')
const Nofan = importLazy('../lib/nofan')
const pm2 = importLazy('../lib/pm2')

updateNotifier({pkg}).notify()

program
  .option('-v, --version', 'Output the version info')
  .option('-t, --time', 'Show time ago tag')
  .option('--no-photo-tag', 'Hide photo tag')
  .version(Nofan.version())

program
  .command('config [consumer_key] [consumer_secret]')
  .option('-a, --all', 'Show all config')
  .description('Config consumer key and consumer secret')
  .action((key, secret, options) => {
    const showAll = options.all
    Nofan.config(key, secret, showAll)
  })

program
  .command('colors')
  .alias('color')
  .description('Customize color style')
  .action(() => {
    Nofan.colors()
  })

program
  .command('login [username] [password]')
  .description('Login nofan')
  .action((username, password) => {
    Nofan.login(username, password)
  })

program
  .command('logout')
  .description('Logout nofan')
  .action(() => {
    Nofan.logout()
  })

program
  .command('switch [id]')
  .alias('s')
  .description('Switch account')
  .action(id => {
    Nofan.switchUser(id)
  })

program
  .command('home [count]')
  .alias('h')
  .option('-r, --reply', 'Enter reply mode')
  .description('Show home timeline')
  .action((count, options) => {
    process.spinner = ora('Fetching').start()
    Nofan.homeTimeline({
      count,
      time_ago: options.parent.time,
      no_photo_tag: !options.parent.photoTag,
      reply: options.reply
    })
  })

program
  .command('mentions [count]')
  .alias('m')
  .option('-r, --reply', 'Enter reply mode')
  .description('Show mentions')
  .action((count, options) => {
    process.spinner = ora('Fetching').start()
    Nofan.mentions({
      count,
      time_ago: options.parent.time,
      no_photo_tag: !options.parent.photoTag,
      reply: options.reply
    })
  })

program
  .command('me [count]')
  .option('-r, --reply', 'Enter reply mode')
  .description('Show my statuses')
  .action((count, options) => {
    process.spinner = ora('Fetching').start()
    Nofan.me({
      count,
      time_ago: options.parent.time,
      no_photo_tag: !options.parent.photoTag,
      reply: options.reply
    })
  })

program
  .command('public [count]')
  .alias('p')
  .option('-r, --reply', 'Enter reply mode')
  .description('Show public timeline')
  .action((count, options) => {
    process.spinner = ora('Fetching').start()
    Nofan.publicTimeline({
      count,
      time_ago: options.parent.time,
      no_photo_tag: !options.parent.photoTag,
      reply: options.reply
    })
  })

program
  .command('search <query> [count]')
  .alias('se')
  .option('-r, --reply', 'Enter reply mode')
  .description('Search public timeline')
  .action((query, count, options) => {
    process.spinner = ora('Fetching').start()
    Nofan.searchTimeline(query, {
      count,
      time_ago: options.parent.time,
      no_photo_tag: !options.parent.photoTag,
      reply: options.reply
    })
  })

program
  .command('trends [count]')
  .alias('tr')
  .option('-r, --reply', 'Enter reply mode')
  .description('Fetch trends')
  .action((count, options) => {
    process.spinner = ora('Fetching').start()
    Nofan.trendsTimeline({count, reply: options.reply})
  })

program
  .command('undo')
  .description('Delete last status')
  .action(() => {
    process.spinner = ora('Deleting').start()
    Nofan.undo()
  })

program
  .command('notifier [operate]')
  .alias('n')
  .description('Nofan Notifier')
  .action(operate => {
    process.spinner = ora('Setting Notifier').start()
    switch (operate) {
      case undefined:
      case 'start':
        pm2.start()
        break
      case 'stop':
        pm2.stop()
        break
      case 'restart':
        pm2.restart()
        break
      case 'delete':
        pm2.deleting()
        break
      default:
        process.spinner.fail('Invalid Notifier command')
        break
    }
  })

program
  .arguments('<status> [more...]')
  .option('-p, --photo <path>', 'Attach a photo')
  .option('-c, --clipboard', 'Use image from clipboard')
  .description('')
  .action((pre, more, options) => {
    process.spinner = ora('Sending').start()
    more.unshift(pre)
    const text = more.join(' ')
    if (options.photo || options.clipboard) {
      Nofan.upload(options, text)
    } else {
      Nofan.update({status: text})
    }
  })

program.parse(process.argv)

if (program.args.length === 0) {
  process.spinner = ora('Fetching').start()
  Nofan.homeTimeline({
    time_ago: program.time,
    no_photo_tag: !program.photoTag
  })
}
