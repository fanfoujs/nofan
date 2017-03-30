#!/usr/bin/env node


const program = require('commander');
const Nofan = require('../lib/nofan');

program
  .version('0.0.1');

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
  .command('config')
  .description('config nofan')
  .action(function () {
    Nofan.config();
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
  .command('*')
  .description('post')
  .action(function (text) {
    Nofan.update(text);
  });

program.parse(process.argv);

if (program.args.length === 0) {
  Nofan.homeTimeline();
}
