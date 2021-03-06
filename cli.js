#!/usr/bin/env node

import path from 'node:path';
import meow from 'meow';
import ora from 'ora';
import Nofan from './src/nofan.js';

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
	}
);

const commands = cli.input;
const {clipboard, photo} = cli.flags;
const nofan = new Nofan(cli.flags);

const spinner = (text) => {
	process.spinner = ora(text).start();
};

switch (commands[0]) {
	case 'config': {
		nofan.configure();
		break;
	}

	case 'colors': {
		nofan.colors();
		break;
	}

	case 'login': {
		const [, username, password] = commands;
		nofan.login(username, password);
		break;
	}

	case 'logout': {
		nofan.logout();
		break;
	}

	case 'switch':
	case 's': {
		const [, id] = commands;
		nofan.switchUser(id);
		break;
	}

	case 'home':
	case 'h': {
		spinner('Fetching');
		nofan.homeTimeline();
		break;
	}

	case 'mentions':
	case 'm': {
		spinner('Fetching');
		nofan.mentions();
		break;
	}

	case 'me': {
		spinner('Fetching');
		nofan.me();
		break;
	}

	case 'public':
	case 'p': {
		spinner('Fetching');
		nofan.publicTimeline();
		break;
	}

	case 'context':
	case 'cont': {
		spinner('Fetch');
		const [, id] = commands;
		nofan.contextTimeline(id);
		break;
	}

	case 'search':
	case 'se': {
		spinner('Fetching');
		const [, ...cmd] = commands;
		const query = cmd.join(' ');
		nofan.searchTimeline(query);
		break;
	}

	case 'trends':
	case 'tr': {
		spinner('Fetching');
		nofan.trendsTimeline();
		break;
	}

	case 'user': {
		spinner('Fetching');
		const [, id] = commands;
		nofan.userTimeline(id);
		break;
	}

	case 'undo': {
		spinner('Deleting');
		nofan.undo();
		break;
	}

	case 'reply':
	case 're': {
		spinner('Sending');
		const [, id, ...cmd] = commands;
		const text = cmd.join(' ');
		nofan.reply(id, text);
		break;
	}

	case 'repost':
	case 'rt': {
		spinner('Sending');
		const [, id, ...cmd] = commands;
		const text = cmd.join(' ');
		nofan.repost(id, text);
		break;
	}

	case 'show': {
		spinner('Fetching');
		const [, id] = commands;
		nofan.show(id);
		break;
	}

	case 'get':
	case 'post': {
		const [method, uri = ''] = commands;
		const uriPath = path.join('/', uri);
		spinner(`${method.toUpperCase()} ${uriPath}`);

		if (!uri) {
			process.spinner.fail('Please specify the URI');
			process.exit(1);
		}

		(async () => {
			try {
				const result = await nofan[method](uriPath);
				process.spinner.succeed();
				nofan.consoleDisplay(result);
			} catch (error) {
				process.spinner.fail();
				nofan.consoleDisplay(error);
				if (!nofan.repl) {
					process.exit(1);
				}
			}
		})();

		break;
	}

	default: {
		if (commands.length > 0) {
			spinner('Sending');
			const text = commands.join(' ');

			if (photo || clipboard) {
				nofan.upload(text);
			} else {
				nofan.update(text);
			}
		} else {
			spinner('Fetching');
			nofan.homeTimeline();
		}

		break;
	}
}
