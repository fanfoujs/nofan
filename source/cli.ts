#!/usr/bin/env node
import path from 'node:path';
import process from 'node:process';
import meow from 'meow';
import Nofan from './nofan.js';
import * as spinner from './spinner.js';

process.on('uncaughtException', (error) => {
	if (error instanceof Error && error.name === 'ExitPromptError') {
		console.log('Aborted');
	} else {
		throw error;
	}
});

const cli = meow(
	`
Usage: nofan [options] [command] <status> [more...]

Options:
  --version                    Output the version number
  --repl                       Inspect result in REPL
  -v, --verbose                Verbose output
  -p, --photo <path>           Attach a photo from path
  -c, --clipboard              Attach a photo from clipboard
  -h, --help                   Output usage information

Commands:
  config                       Config nofan
  colors                       Customize color style
  login [username] [password]  Login nofan
  logout                       Logout nofan
  switch|s [id]                Switch account
  home|h                       Show home timeline
  mentions|m                   Show mentions
  me                           Show my statuses
  public|p                     Show public timeline
  context|cont                 Show context timeline
  search|se <query>            Search public or user timeline
  trends|tr                    Fetch trends
  user <id>                    Fetch user-timeline
  show <id>                    Fetch status item
  reply|re <id> [text]         Reply status
  repost|rt <id> [text]        Repost status
  undo                         Delete last status
  <text> [more...]             Post status
  get <uri>                    Create GET request
  post <uri>                   Create POST request
`,
	{
		importMeta: import.meta,
		flags: {
			help: {
				type: 'boolean',
				shortFlag: 'h',
			},
			clipboard: {
				type: 'boolean',
				shortFlag: 'c',
			},
			photo: {
				type: 'string',
				shortFlag: 'p',
			},
			verbose: {
				type: 'boolean',
				shortFlag: 'v',
			},
		},
	},
);

const commands = cli.input;
const {clipboard, photo} = cli.flags;
const nofan = new Nofan(cli.flags);
await nofan.initConfig({verbose: cli.flags.verbose});

// eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
switch (commands[0]) {
	case 'config': {
		void nofan.configure();
		break;
	}

	case 'colors': {
		void nofan.colors();
		break;
	}

	case 'login': {
		const [, username = '', password = ''] = commands;
		void nofan.login(username, password);
		break;
	}

	case 'logout': {
		void nofan.logout();
		break;
	}

	case 'switch':
	case 's': {
		const [, id] = commands;
		void nofan.switchUser(id);
		break;
	}

	case 'home':
	case 'h': {
		spinner.start('Fetching');
		void nofan.homeTimeline();
		break;
	}

	case 'mentions':
	case 'm': {
		spinner.start('Fetching');
		void nofan.mentions();
		break;
	}

	case 'me': {
		spinner.start('Fetching');
		void nofan.me();
		break;
	}

	case 'public':
	case 'p': {
		spinner.start('Fetching');
		void nofan.publicTimeline();
		break;
	}

	case 'context':
	case 'cont': {
		spinner.start('Fetch');
		const [, id = ''] = commands;
		void nofan.contextTimeline(id);
		break;
	}

	case 'search':
	case 'se': {
		spinner.start('Fetching');
		const [, ...cmd] = commands;
		const query = cmd.join(' ');
		void nofan.searchTimeline(query);
		break;
	}

	case 'trends':
	case 'tr': {
		spinner.start('Fetching');
		void nofan.trendsTimeline();
		break;
	}

	case 'user': {
		spinner.start('Fetching');
		const [, id = ''] = commands;
		void nofan.userTimeline(id);
		break;
	}

	case 'undo': {
		spinner.start('Deleting');
		void nofan.undo();
		break;
	}

	case 'reply':
	case 're': {
		spinner.start('Sending');
		const [, id = '', ...cmd] = commands;
		const text = cmd.join(' ');
		void nofan.reply(id, text);
		break;
	}

	case 'repost':
	case 'rt': {
		spinner.start('Sending');
		const [, id = '', ...cmd] = commands;
		const text = cmd.join(' ');
		void nofan.repost(id, text);
		break;
	}

	case 'show': {
		spinner.start('Fetching');
		const [, id = ''] = commands;
		void nofan.show(id);
		break;
	}

	case 'get':
	case 'post': {
		const [method, uri = ''] = commands;
		const uriPath = path.join('/', uri);
		spinner.start(`${method.toUpperCase()} ${uriPath}`);

		if (!uri) {
			spinner.fail('Please specify the URI');
			process.exit(1);
		}

		try {
			const result = await nofan[method](uriPath);
			spinner.succeed();
			nofan.consoleDisplay(result);
		} catch (error) {
			spinner.fail();
			nofan.consoleDisplay(error);
			if (!nofan.repl) {
				process.exit(1);
			}
		}

		break;
	}

	default: {
		if (commands.length > 0) {
			spinner.start('Sending');
			const text = commands.join(' ');

			if (photo ?? clipboard) {
				void nofan.upload(text);
			} else {
				void nofan.update(text);
			}
		} else {
			spinner.start('Fetching');
			void nofan.homeTimeline();
		}

		break;
	}
}
