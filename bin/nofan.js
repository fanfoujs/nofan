#!/usr/bin/env node


const program = require('commander');
const Nofan = require('../lib/nofan');

program
  .version(require('../package').version);

program
  .command('config')
  .description('config consumer key and consumer secret')
  .action(function () {
    Nofan.config();
  });

program
  .command('login')
  .description('login nofan')
  .action(function () {
    Nofan.login();
  });

program
  .command('logout')
  .description('logout nofan')
  .action(function () {
    Nofan.logout();
  });

program
  .command('home [count]')
  .alias('h')
  .description('show home timeline')
  .action(function (count) {
    Nofan.homeTimeline(count);
  });

program
  .command('mentions [count]')
  .alias('m')
  .description('show mentions')
  .action(function (count) {
    Nofan.mentions(count);
  });

program
  .command('public [count]')
  .alias('p')
  .description('show public timeline')
  .action(function (count) {
    Nofan.publicTimeline(count);
  });

program
  .command('undo')
  .description('delete last status')
  .action(function () {
    Nofan.undo();
  });

program
  .command('*')
  .description('post')
  .action(function (text) {
    Nofan.update(text);
  });

program.parse(process.argv);

if (program.args.length === 0) {
  Nofan.homeTimeline();
}
