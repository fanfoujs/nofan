#!/usr/bin/env node

const program = require('commander');
const importLazy = require('import-lazy')(require);

const ora = importLazy('ora');
const updateNotifier = importLazy('update-notifier');
const pkg = importLazy('../package');
const Nofan = importLazy('../src/nofan');

updateNotifier({pkg}).notify({isGlobal: true});

program
	.version(Nofan.version(), '--version')
	.option('-v, --verbose', 'Verbose output');

program
	.command('config')
	.option('-a, --all', 'Show advanced config')
	.description('Config display')
	.action(options => {
		const showAll = options.all;
		Nofan.config(showAll);
	});

program
	.command('colors')
	.alias('color')
	.description('Customize color style')
	.action(() => {
		Nofan.colors();
	});

program
	.command('login [username] [password]')
	.description('Login nofan')
	.action((username, password) => {
		Nofan.login(username, password);
	});

program
	.command('logout')
	.description('Logout nofan')
	.action(() => {
		Nofan.logout();
	});

program
	.command('switch [id]')
	.alias('s')
	.description('Switch account')
	.action(id => {
		Nofan.switchUser(id);
	});

program
	.command('home [count]')
	.alias('h')
	.description('Show home timeline')
	.action((count, options) => {
		process.spinner = ora('Fetching').start();
		Nofan.homeTimeline({
			count,
			verbose: options.parent.verbose
		});
	});

program
	.command('mentions [count]')
	.alias('m')
	.description('Show mentions')
	.action((count, options) => {
		process.spinner = ora('Fetching').start();
		Nofan.mentions({
			count,
			verbose: options.parent.verbose
		});
	});

program
	.command('me [count]')
	.description('Show my statuses')
	.action((count, options) => {
		process.spinner = ora('Fetching').start();
		Nofan.me({
			count,
			verbose: options.parent.verbose
		});
	});

program
	.command('public [count]')
	.alias('p')
	.description('Show public timeline')
	.action((count, options) => {
		process.spinner = ora('Fetching').start();
		Nofan.publicTimeline({
			count,
			verbose: options.parent.verbose
		});
	});

program
	.command('search <query> [count]')
	.alias('se')
	.description('Search public timeline')
	.action((query, count, options) => {
		process.spinner = ora('Fetching').start();
		Nofan.searchTimeline(query, {
			count,
			verbose: options.parent.verbose
		});
	});

program
	.command('trends [count]')
	.alias('tr')
	.description('Fetch trends')
	.action((count, options) => {
		process.spinner = ora('Fetching').start();
		Nofan.trendsTimeline({count, verbose: options.parent.verbose});
	});

program
	.command('user <id> [count]')
	.description('Fetch user-timeline')
	.action((id, count, options) => {
		process.spinner = ora('Fetching').start();
		Nofan.userTimeline(id, {
			count,
			verbose: options.parent.verbose
		});
	});

program
	.command('undo')
	.description('Delete last status')
	.action(() => {
		process.spinner = ora('Deleting').start();
		Nofan.undo();
	});

program
	.arguments('<status> [more...]')
	.option('-p, --photo <path>', 'Attach a photo from path')
	.option('-c, --clipboard', 'Attach a photo from clipboard')
	.description('')
	.action((pre, more, options) => {
		process.spinner = ora('Sending').start();
		more.unshift(pre);
		const text = more.join(' ');
		if (options.photo || options.clipboard) {
			Nofan.upload(options, text);
		} else {
			Nofan.update(text);
		}
	});

program.parse(process.argv);

if (program.args.length === 0) {
	process.spinner = ora('Fetching').start();
	Nofan.homeTimeline({verbose: false});
}
