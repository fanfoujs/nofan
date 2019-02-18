#!/usr/bin/env node

const meow = require('meow');
const importLazy = require('import-lazy')(require);

const ora = importLazy('ora');
const updateNotifier = importLazy('update-notifier');
const pkg = importLazy('../package');
const Nofan = importLazy('../src/nofan');

updateNotifier({pkg}).notify({isGlobal: true});

const cli = meow(`
Usage: nofan [options] [command] <status> [more...]

Options:
  --version                    Output the version number
  -v, --verbose                Verbose output
  -p, --photo <path>           Attach a photo from path
  -c, --clipboard              Attach a photo from clipboard
  -h, --help                   Output usage information

Commands:
  config                       Config nofan
  colors|color                 Customize color style
  login [username] [password]  Login nofan
  logout                       Logout nofan
  switch|s [id]                Switch account
  home|h                       Show home timeline
  mentions|m                   Show mentions
  me [count]                   Show my statuses
  public|p                     Show public timeline
  search|se <query>            Search public timeline
  trends|tr                    Fetch trends
  user <id>                    Fetch user-timeline
	undo                         Delete last status
	<status> [more...]           Post status
`, {
	flags: {
		help: {
			alias: 'h'
		},
		clipboard: {
			alias: 'c'
		},
		photo: {
			alias: 'p'
		},
		verbose: {
			alias: 'v'
		}
	}
});

const commands = cli.input;
const {clipboard, photo, verbose} = cli.flags;

const spinner = text => {
	process.spinner = ora(text).start();
};

switch (commands[0]) {
	case 'config': {
		Nofan.config();
		break;
	}

	case 'colors': {
		Nofan.colors();
		break;
	}

	case 'login': {
		const [, username, password] = commands;
		Nofan.login(username, password);
		break;
	}

	case 'logout': {
		Nofan.logout();
		break;
	}

	case 'switch': {
		const [, id] = commands;
		Nofan.switch(id);
		break;
	}

	case 'home':
	case 'h': {
		spinner('Fetching');
		Nofan.homeTimeline({verbose});
		break;
	}

	case 'mentions':
	case 'm': {
		spinner('Fetching');
		Nofan.mentions({verbose});
		break;
	}

	case 'me': {
		spinner('Fetching');
		Nofan.me({verbose});
		break;
	}

	case 'public':
	case 'p': {
		spinner('Fetching');
		Nofan.publicTimeline({verbose});
		break;
	}

	case 'search':
	case 'se': {
		spinner('Fetching');
		const [, query] = commands;
		Nofan.searchTimeline(query, {verbose});
		break;
	}

	case 'trends':
	case 'tr': {
		spinner('Fetching');
		Nofan.trendsTimeline({verbose});
		break;
	}

	case 'user': {
		spinner('Fetching');
		const [, id] = commands;
		Nofan.userTimeline(id, {verbose});
		break;
	}

	case 'undo': {
		spinner('Deleting');
		Nofan.undo();
		break;
	}

	default: {
		if (commands.length > 0) {
			spinner('Sending');
			const text = commands.join(' ');

			if (photo || clipboard) {
				Nofan.upload({photo, clipboard}, text);
			} else {
				Nofan.update(text);
			}
		} else {
			spinner('Fetching');
			Nofan.homeTimeline({verbose});
		}
	}
}
