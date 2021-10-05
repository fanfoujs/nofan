import fs from 'node:fs';
import process from 'node:process';
import isWsl from 'is-wsl';
import justSnakeCase from 'just-snake-case';
import terminalLink from 'terminal-link';
import chalkPipe from 'chalk-pipe';
import timeago from 'timeago.js';
import Fanfou, {
	getPlainText,
	getEntities,
	Status,
	StatusEntity,
	GetTrendsResult,
	Trend,
} from 'fanfou-sdk';
import inquirer from 'inquirer';
import moment from 'moment';
import ora from 'ora';
import * as util from './util.js';
import {showInRepl} from './repl.js';
import {colorsPrompt} from './prompts/colors.js';
import {configPrompt} from './prompts/config.js';
import {loginPrompt} from './prompts/login.js';
import {switchPrompt} from './prompts/switch.js';
import {trendsPrompt} from './prompts/trends.js';
import {Account, Config, ConsoleType, Settings} from './types.js';

type NofanOptions = {
	verbose?: boolean;
	photo?: string;
	clipboard?: boolean;
	repl?: boolean;
	consoleType?: ConsoleType;
};

class Nofan {
	photo?: string;
	clipboard?: boolean;
	repl?: boolean;
	consoleType?: string;
	params?: any;
	config: Config;
	verbose?: boolean;

	constructor(options: NofanOptions = {}) {
		const {
			verbose,
			photo,
			clipboard,
			repl,
			consoleType = 'log',
			...parameters
		} = options;

		this.photo = photo;
		this.clipboard = clipboard;
		this.repl = repl;
		this.consoleType = consoleType;
		this.params = {};

		for (const key of Object.keys(parameters)) {
			// @ts-expect-error: Accept any fanfou query
			this.params[justSnakeCase(key)] = parameters[key];
		}

		try {
			this.config = util.getConfig();
			this.verbose = this.config.VERBOSE ?? verbose;
		} catch (error: any) {
			process.spinner.fail(error.message);
			process.exit();
		}
	}

	async login(username: string, password: string) {
		const {config} = this;
		const login = async (username: string, password: string) => {
			const ff = new Fanfou({
				consumerKey: config.CONSUMER_KEY,
				consumerSecret: config.CONSUMER_SECRET,
				username,
				password,
				protocol: config.SSL ? 'https:' : 'http:',
				apiDomain: config.API_DOMAIN,
				oauthDomain: config.OAUTH_DOMAIN,
				hooks: {
					baseString: (string) =>
						config.SSL ? string.replace('https', 'http') : string,
				},
			});

			try {
				config.USER = username;
				const token = await ff.xauth();
				util.createNofanDir();
				util.setConfig(config);
				const account = util.getAccount();
				account[username] = {
					/* eslint-disable @typescript-eslint/naming-convention */
					CONSUMER_KEY: config.CONSUMER_KEY,
					CONSUMER_SECRET: config.CONSUMER_SECRET,
					OAUTH_TOKEN: token.oauthToken,
					OAUTH_TOKEN_SECRET: token.oauthTokenSecret,
					/* eslint-enable @typescript-eslint/naming-convention */
				};
				util.setAccount(account);
				process.spinner.succeed('Login succeed!');
				process.exit(0);
			} catch (error: any) {
				process.spinner.fail(error.message);
				process.exit(1);
			}
		};

		if (username && password) {
			(process as any).spinner = ora('Logging in...').start();
			void login(username, password);
		} else {
			const user = await inquirer.prompt(
				loginPrompt({hasName: Boolean(username)}),
			);
			if (username) {
				user.username = username;
			}

			process.spinner = ora('Logging in').start();
			void login(user.username, user.password);
		}
	}

	async logout() {
		process.spinner = ora('Logging out').start();
		const {config} = this;
		if (config.USER) {
			const account = util.getAccount();
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete account[config.USER];
			config.USER = Object.keys(account)[0] ?? '';
			util.setConfig(config);
			util.setAccount(account);
			process.spinner.succeed('Logout succeed!');
		}
	}

	async configure() {
		const {config} = this;
		const settings: Settings = await inquirer.prompt(configPrompt(config));

		config.CONSUMER_KEY = settings.key || util.defaultConfig.CONSUMER_KEY;
		config.CONSUMER_SECRET =
			settings.secret || util.defaultConfig.CONSUMER_SECRET;
		config.DISPLAY_COUNT = Number(settings.display_count);
		config.TIME_TAG = settings.display.includes('time_tag');
		config.PHOTO_TAG = settings.display.includes('photo_tag');
		config.SSL = settings.display.includes('use_https');
		config.VERBOSE = settings.display.includes('verbose_mode');

		if (settings.api_domain) {
			config.API_DOMAIN = settings.api_domain;
		}

		if (settings.oauth_domain) {
			config.OAUTH_DOMAIN = settings.oauth_domain;
		}

		util.createNofanDir();
		util.setConfig(config);
	}

	async colors() {
		const {config} = this;
		const paints = await inquirer.prompt(colorsPrompt(config));
		const colors = {...paints};
		config.COLORS = colors;
		util.createNofanDir();
		util.setConfig(config);
	}

	async switchUser(id?: string) {
		const {config} = this;
		const account = util.getAccount();

		if (id) {
			const found = Object.keys(account).find(
				(k) => k.toLowerCase() === id.toLowerCase(),
			);
			if (found) {
				config.USER = found;
				util.setConfig(config);
				(process as any).spinner = ora().succeed(
					`Switch account to ${chalkPipe('blue.bold')(found)}`,
				);
			} else {
				(process as any).spinner = ora().info(
					`${chalkPipe('blue.bold')(id)} needs login`,
				);
				process.exit(1);
			}
		} else {
			const currentName = config.USER;
			const choices = Object.keys(account).map((name) => {
				if (name === currentName) {
					return {name, disabled: chalkPipe('green')('current')};
				}

				return name;
			});
			if (choices.length > 1) {
				const user = await inquirer.prompt(switchPrompt(choices));
				config.USER = user.username;
				util.setConfig(config);
			} else {
				(process as any).spinner = ora().info('No more account');
				process.exit(1);
			}
		}
	}

	async homeTimeline() {
		const {DISPLAY_COUNT: count} = this.config;
		const statuses = await this._get('/statuses/home_timeline', {
			count,
			format: 'html',
			...this.params,
		});
		this._displayTimeline(statuses, {verbose: this.verbose});
	}

	async publicTimeline() {
		const {DISPLAY_COUNT: count} = this.config;
		const statuses = await this._get('/statuses/public_timeline', {
			count,
			format: 'html',
			...this.params,
		});
		this._displayTimeline(statuses, {verbose: this.verbose});
	}

	async contextTimeline(id: string) {
		const statuses = await this._get('/statuses/context_timeline', {
			id,
			format: 'html',
			...this.params,
		});
		this._displayTimeline(statuses, {verbose: this.verbose});
	}

	async searchTimeline(q: string) {
		const {DISPLAY_COUNT: count} = this.config;
		const uri = this.params.id
			? '/search/user_timeline'
			: '/search/public_timeline';
		const statuses = await this._get(uri, {
			q,
			count,
			format: 'html',
			...this.params,
		});
		this._displayTimeline(statuses, {verbose: this.verbose});
	}

	async trendsTimeline() {
		const [{trends: hotTrends}, savedTrends]: [GetTrendsResult, Trend[]] = [
			await this._get('/trends/list'),
			await this._get('/saved_searches/list'),
		];

		if (hotTrends.length + savedTrends.length > 0) {
			process.spinner.stop();
			const {trends: trend} = await inquirer.prompt(
				trendsPrompt(hotTrends, savedTrends),
			);
			process.spinner.start('Fetching');
			await this.searchTimeline(trend);
			process.exit(0);
		} else {
			process.spinner.fail('No trends exist');
			process.exit(1);
		}
	}

	async userTimeline(id: string) {
		const {DISPLAY_COUNT: count} = this.config;
		const statuses = await this._get('/statuses/user_timeline', {
			id,
			count,
			format: 'html',
			...this.params,
		});
		this._displayTimeline(statuses, {verbose: this.verbose});
	}

	async update(text: string) {
		await this._post('/statuses/update', {status: text, ...this.params});
		process.spinner.succeed('Sent!');
	}

	async upload(text: string) {
		const {photo, clipboard} = this;
		if (photo) {
			await this._upload(photo, text);
		} else if (clipboard) {
			switch (process.platform) {
				case 'darwin': {
					const temporaryFilepath = await util.getTemporaryImagePathMacos();
					await this._upload(temporaryFilepath, text);
					break;
				}

				case 'win32': {
					const temporaryFilepath = await util.getTemporaryImagePathWindows();
					await this._upload(temporaryFilepath, text);
					break;
				}

				// @ts-expect-error: Only support WSL
				case 'linux': {
					if (isWsl) {
						process.env['NPS'] = 'powershell.exe';
						const temporaryFilepath = await util.getTemporaryImagePathWindows();
						await this._upload(temporaryFilepath, text);
						break;
					}
				}

				// eslint-disable no-fallthrough
				default: {
					process.spinner.fail(
						'Upload from clipboard only available on macOS, Windows and WSL',
					);
					process.exit(1);
				}
			}
		}

		process.spinner.succeed('Sent!');
	}

	async undo() {
		const statuses = await this._get('/statuses/user_timeline', {});
		await this._post('/statuses/destroy', {id: statuses[0].id});
		process.spinner.succeed('Deleted!');
	}

	async mentions() {
		const {DISPLAY_COUNT: count} = this.config;
		const statuses = await this._get('/statuses/mentions', {
			count,
			format: 'html',
			...this.params,
		});
		this._displayTimeline(statuses, {verbose: this.verbose});
	}

	async me() {
		const {DISPLAY_COUNT: count} = this.config;
		const statuses = await this._get('/statuses/user_timeline', {
			count,
			format: 'html',
			...this.params,
		});
		this._displayTimeline(statuses, {verbose: this.verbose});
	}

	async reply(id: string, text: string) {
		const status: Status = await this._getStatus(id);
		const replyText = `@${status?.user?.name ?? ''} ${text}`.trim();
		await this._post('/statuses/update', {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			in_reply_to_status_id: id,
			status: replyText,
			...this.params,
		});
		process.spinner.succeed('Sent!');
	}

	async repost(id: string, text: string) {
		const status: Status = await this._getStatus(id);
		const repostText = `${text} 转@${status?.user?.name ?? ''} ${getPlainText(
			getEntities(status.text),
		)}`.trim();
		await this._post('/statuses/update', {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			repost_status_id: id,
			status: repostText,
			...this.params,
		});
		process.spinner.succeed('Sent!');
	}

	async show(id: string) {
		const status = await this._getStatus(id);
		this._displayTimeline([status], {verbose: this.verbose});
	}

	async get(uri: string) {
		return this._get(uri, this.params);
	}

	async post(uri: string) {
		return this._post(uri, this.params);
	}

	async _get(uri: string, parameters?: any) {
		const {config} = this;
		const account = util.getAccount();
		let user = account[config.USER ?? ''];
		if (!user) {
			for (const name in account) {
				if (account[name]) {
					user = account[name];
					config.USER = name;
					break;
				}
			}

			if (!user) {
				process.spinner.fail('Not logged in');
				process.exit(1);
			}
		}

		util.setConfig(config);

		const ff = this.initFanfou(user);
		try {
			const result = await ff.get(uri, parameters);
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return result;
		} catch (error) {
			this._handleError(error);
		}
	}

	// @ts-expect-error: Exit when error eccorred
	async _post(uri: string, parameters: any) {
		const {config} = this;
		const account = util.getAccount();
		let user = account[config.USER ?? ''];

		if (!user) {
			for (const name in account) {
				if (account[name]) {
					user = account[name];
					config.USER = name;
					break;
				}
			}

			if (!user) {
				process.spinner.fail('Not logged in');
				process.exit(1);
			}
		}

		util.setConfig(config);

		const ff = this.initFanfou(user);
		try {
			const result: Status = await ff.post(uri, parameters);
			return result;
		} catch (error: any) {
			this._handleError(error);
		}
	}

	async _getStatus(id: string) {
		return this._get('/statuses/show', {id, format: 'html'});
	}

	// @ts-expect-error: Exit when error occurred
	async _upload(path: string, status: string) {
		const {config} = this;
		const account = util.getAccount();
		let user = account[config.USER ?? ''];
		if (!user) {
			for (const name in account) {
				if (account[name]) {
					user = account[name];
					config.USER = name;
					break;
				}
			}

			if (!user) {
				process.spinner.fail('Not logged in');
				process.exit(1);
			}
		}

		util.setConfig(config);
		const ff = this.initFanfou(user);

		try {
			const result: Status = await ff.post('/photos/upload', {
				photo: fs.createReadStream(path),
				status,
			});
			return result;
		} catch (error: any) {
			this._handleError(error);
		}
	}

	_handleError(error: any) {
		if (this.repl) {
			process.spinner.fail(error.message);
			// @ts-expect-error: Mute succeed function
			process.spinner.succeed = () => {}; // eslint-disable-line @typescript-eslint/no-empty-function
			showInRepl(error);
		} else {
			process.spinner.fail(error.message);
			process.exit(1);
		}
	}

	_displayTimeline(timeline: any, opt: any) {
		const {config} = this;

		if (process.spinner) {
			process.spinner.stop();
		}

		const {verbose = false} = opt;
		const hasTimeTag = config.TIME_TAG;
		const hasPhotoTag = config.PHOTO_TAG;
		const {COLORS: defaultColors} = util.defaultConfig;
		const {COLORS: colors = defaultColors} = config ?? {};

		const {
			name: nameColor,
			text: textColor,
			at: atColor,
			link: linkColor,
			tag: tagColor,
			photo: photoColor,
			timeago: timeagoColor,
			highlight: highlightColor,
		} = colors;

		const parseHighlight = (style: string, item: StatusEntity) => {
			let appendText = '';

			if (verbose && item.type === 'at') {
				appendText = chalkPipe(style)(`:${item.id}`);
			}

			if (item.boldTexts) {
				const highlightText = item.boldTexts
					.map((keyword) => {
						if (keyword.isBold) {
							const boldColor = `${style}.${highlightColor}`;
							return chalkPipe(boldColor)(keyword.text);
						}

						return chalkPipe(style)(keyword.text);
					})
					.join('');

				return highlightText + appendText;
			}

			return false;
		};

		for (const status of timeline as Status[]) {
			let text = '';
			for (const item of getEntities(status.text)) {
				switch (item.type) {
					case 'at':
						text +=
							parseHighlight(atColor, item) ||
							chalkPipe(atColor)(
								verbose ? `${item.text}:${item.id}` : item.text,
							);
						break;
					case 'link':
						text +=
							parseHighlight(linkColor, item) ||
							chalkPipe(linkColor)(item.text);
						break;
					case 'tag':
						text +=
							parseHighlight(tagColor, item) || chalkPipe(tagColor)(item.text);
						break;
					default:
						text +=
							parseHighlight(textColor, item) ||
							chalkPipe(textColor)(item.text);
						break;
				}
			}

			const name =
				chalkPipe(textColor)('[') +
				chalkPipe(nameColor)(
					verbose
						? `${status?.user?.name}(${status?.user?.id}):${status.id}` // eslint-disable-line @typescript-eslint/restrict-template-expressions
						: status?.user?.name,
				) +
				chalkPipe(textColor)(']');
			if (status.photo && hasPhotoTag) {
				const photoTag = chalkPipe(photoColor)(
					terminalLink(
						'[图]',
						status?.photo?.largeurl.replace(/@.+\..+$/g, '') ?? '',
						{
							fallback: (text) => text,
						},
					),
				);
				text += text.length > 0 ? ` ${photoTag}` : photoTag;
			}

			if (hasTimeTag) {
				const statusTimeAgo = chalkPipe(timeagoColor)(
					`(${
						verbose
							? `${moment(new Date(status.createdAt))
									.local()
									.format('YYYY-MM-DD HH:mm:ss')}`
							: timeago.format(status.createdAt)
					})`,
				);
				console.log(`${name} ${text} ${statusTimeAgo}`);
			} else {
				console.log(`${name} ${text}`);
			}
		}
	}

	consoleDisplay(item: any) {
		const {repl, consoleType = 'log'} = this;
		if (repl) {
			showInRepl(item);
		} else {
			// @ts-expect-error: Allow use specific console type
			console[consoleType](item); // eslint-disable-line @typescript-eslint/no-unsafe-call
		}
	}

	initFanfou(user: Account) {
		const {config} = this;
		return new Fanfou({
			consumerKey: user.CONSUMER_KEY,
			consumerSecret: user.CONSUMER_SECRET,
			oauthToken: user.OAUTH_TOKEN,
			oauthTokenSecret: user.OAUTH_TOKEN_SECRET,
			protocol: config.SSL ? 'https:' : 'http:',
			apiDomain: config.API_DOMAIN,
			oauthDomain: config.OAUTH_DOMAIN,
			hooks: {
				baseString: (string) =>
					config.SSL ? string.replace('https', 'http') : string,
			},
		});
	}
}

export default Nofan;
