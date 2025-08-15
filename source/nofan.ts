import fs from 'node:fs';
import process from 'node:process';
import chalkPipe from 'chalk-pipe';
import Fanfou, {
	type GetTrendsResult,
	type Status,
	type StatusEntity,
	type Trend,
	getEntities,
	getPlainText,
} from 'fanfou-sdk';
import isWsl from 'is-wsl';
import justSnakeCase from 'just-snake-case';
import moment from 'moment';
import terminalLink from 'terminal-link';
import timeago from 'timeago.js';
import {colorsPrompt} from './prompts/colors.js';
import {configPrompt} from './prompts/config.js';
import {loginPrompt} from './prompts/login.js';
import {switchPrompt} from './prompts/switch.js';
import {trendsPrompt} from './prompts/trends.js';
import {showInRepl} from './repl.js';
import * as spinner from './spinner.js';
import {
	type Account,
	type Config,
	type ConsoleType,
	type Settings,
} from './types.js';
import * as util from './util.js';

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
	config: Config = util.defaultConfig;
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
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			this.params[justSnakeCase(key)] = parameters[key];
		}
	}

	async initConfig(options?: {verbose?: boolean}) {
		try {
			this.config = await util.getConfig();
			// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
			this.verbose = this.config.VERBOSE || options?.verbose;
		} catch (error) {
			spinner.fail(
				error instanceof Error
					? error.message
					: 'Failed to load config with unknown reason',
			);
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
				await util.createNofanDir();
				await util.setConfig(config);
				const account = await util.getAccount();
				account[username] = {
					/* eslint-disable @typescript-eslint/naming-convention */
					CONSUMER_KEY: config.CONSUMER_KEY,
					CONSUMER_SECRET: config.CONSUMER_SECRET,
					OAUTH_TOKEN: token.oauthToken,
					OAUTH_TOKEN_SECRET: token.oauthTokenSecret,
					/* eslint-enable @typescript-eslint/naming-convention */
				};
				await util.setAccount(account);
				spinner.succeed('Login succeed!');
				process.exit(0);
			} catch (error) {
				spinner.fail(
					error instanceof Error
						? error.message
						: 'Login failed with unknown reason',
				);
				process.exit(1);
			}
		};

		if (username && password) {
			spinner.start('Logging in...');
			void login(username, password);
		} else {
			const user = await loginPrompt({currentUsername: username});
			if (username) {
				user.username = username;
			}

			spinner.start('Logging in');
			void login(user.username, user.password);
		}
	}

	async logout() {
		spinner.start('Logging out');
		const {config} = this;
		if (config.USER) {
			const account = await util.getAccount();
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete account[config.USER];
			config.USER = Object.keys(account)[0] ?? '';
			await util.setConfig(config);
			await util.setAccount(account);
			spinner.succeed('Logout succeed!');
		}
	}

	async configure() {
		const {config} = this;
		const settings: Settings = await configPrompt(config);

		config.CONSUMER_KEY =
			settings.consumerKey || util.defaultConfig.CONSUMER_KEY;
		config.CONSUMER_SECRET =
			settings.consumerSecret || util.defaultConfig.CONSUMER_SECRET;
		config.DISPLAY_COUNT = Number(settings.displayCount);
		config.TIME_TAG = settings.displayConfigs.includes('timeTag');
		config.PHOTO_TAG = settings.displayConfigs.includes('photoTag');
		config.SSL = settings.displayConfigs.includes('useHttps');
		config.VERBOSE = settings.displayConfigs.includes('verboseMode');

		if (settings.apiDomain) {
			config.API_DOMAIN = settings.apiDomain;
		}

		if (settings.oauthDomain) {
			config.OAUTH_DOMAIN = settings.oauthDomain;
		}

		await util.createNofanDir();
		await util.setConfig(config);
	}

	async colors() {
		const {config} = this;
		const paints = await colorsPrompt(config);
		const colors = {...paints};
		config.COLORS = colors;
		await util.createNofanDir();
		await util.setConfig(config);
	}

	async switchUser(id?: string) {
		const {config} = this;
		const account = await util.getAccount();

		if (id) {
			const found = Object.keys(account).find(
				(k) => k.toLowerCase() === id.toLowerCase(),
			);
			if (found) {
				config.USER = found;
				await util.setConfig(config);
				spinner.succeed(`Switch account to ${chalkPipe('blue.bold')(found)}`);
			} else {
				spinner.info(`${chalkPipe('blue.bold')(id)} needs login`);
				process.exit(1);
			}
		} else {
			const currentName = config.USER;
			const choices = Object.keys(account).map((name) => ({
				value: name,
				disabled: name === currentName ? chalkPipe('green')('current') : false,
			}));
			if (choices.length > 1) {
				const user = await switchPrompt(choices);
				config.USER = user;
				await util.setConfig(config);
			} else {
				spinner.info('No more account');
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
		const [{trends: hotTrends}, savedTrends] = [
			await this._get<GetTrendsResult>('/trends/list'),
			await this._get<Trend[]>('/saved_searches/list'),
		];

		if (hotTrends.length + savedTrends.length > 0) {
			spinner.stop();
			const trend = await trendsPrompt(hotTrends, savedTrends);
			spinner.start('Fetching');
			await this.searchTimeline(trend);
			process.exit(0);
		} else {
			spinner.fail('No trends exist');
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
		spinner.succeed('Sent!');
	}

	async upload(text: string) {
		const {photo, clipboard} = this;
		if (photo) {
			await this._upload(photo, text);
		} else if (clipboard) {
			// eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
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

				// eslint-disable-next-line no-fallthrough
				default: {
					spinner.fail(
						'Upload from clipboard only available on macOS, Windows and WSL',
					);
					process.exit(1);
				}
			}
		}

		spinner.succeed('Sent!');
	}

	async undo() {
		const statuses = await this._get<Status[]>('/statuses/user_timeline', {});
		// @ts-expect-error: Assume the first status is the latest one
		await this._post<Status>('/statuses/destroy', {id: statuses[0].id});
		spinner.succeed('Deleted!');
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
		spinner.succeed('Sent!');
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
		spinner.succeed('Sent!');
	}

	async show(id: string) {
		const status = await this._getStatus(id);
		this._displayTimeline([status], {verbose: this.verbose});
	}

	async get<T>(uri: string): Promise<T> {
		return this._get<T>(uri, this.params);
	}

	async post<T>(uri: string): Promise<T> {
		return this._post<T>(uri, this.params);
	}

	// @ts-expect-error: We've handled undefined return by throwing error
	async _get<T>(uri: string, parameters?: any): Promise<T> {
		const {config} = this;
		const account = await util.getAccount();
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
				spinner.fail('Not logged in');
				process.exit(1);
			}
		}

		await util.setConfig(config);

		const ff = this.initFanfou(user);
		try {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			const result = await ff.get<T>(uri, parameters);
			return result;
		} catch (error) {
			this._handleError(error);
		}
	}

	// @ts-expect-error: We've handled undefined return by throwing error
	async _post<T>(uri: string, parameters: any): Promise<T> {
		const {config} = this;
		const account = await util.getAccount();
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
				spinner.fail('Not logged in');
				process.exit(1);
			}
		}

		await util.setConfig(config);

		const ff = this.initFanfou(user);
		try {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			const result = await ff.post<T>(uri, parameters);
			return result;
		} catch (error) {
			this._handleError(error);
		}
	}

	async _getStatus(id: string) {
		return this._get<Status>('/statuses/show', {id, format: 'html'});
	}

	// @ts-expect-error: We've handled undefined return by throwing error
	async _upload(path: string, status: string): Promise<Status> {
		const {config} = this;
		const account = await util.getAccount();
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
				spinner.fail('Not logged in');
				process.exit(1);
			}
		}

		await util.setConfig(config);
		const ff = this.initFanfou(user);

		try {
			const result = await ff.post<Status>('/photos/upload', {
				photo: fs.createReadStream(path),
				status,
			});
			return result;
		} catch (error) {
			this._handleError(error);
		}
	}

	_handleError(error: unknown) {
		spinner.fail(error instanceof Error ? error.message : 'Unknown error');
		if (this.repl) {
			showInRepl(error);
		} else {
			process.exit(1);
		}
	}

	// eslint-disable-next-line complexity
	_displayTimeline(timeline: any, options: any) {
		const {config} = this;

		spinner.stop();

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const {verbose = false} = options;
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
				// eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
				switch (item.type) {
					case 'at': {
						text +=
							parseHighlight(atColor, item) ||
							chalkPipe(atColor)(
								verbose ? `${item.text}:${item.id}` : item.text,
							);
						break;
					}

					case 'link': {
						text +=
							parseHighlight(linkColor, item) ||
							chalkPipe(linkColor)(item.text);
						break;
					}

					case 'tag': {
						text +=
							parseHighlight(tagColor, item) || chalkPipe(tagColor)(item.text);
						break;
					}

					default: {
						text +=
							parseHighlight(textColor, item) ||
							chalkPipe(textColor)(item.text);
						break;
					}
				}
			}

			const name =
				chalkPipe(textColor)('[') +
				chalkPipe(nameColor)(
					verbose
						? `${status?.user?.name}(${status?.user?.id}):${status.id}`
						: status?.user?.name,
				) +
				chalkPipe(textColor)(']');
			if (status.photo && hasPhotoTag) {
				const photoTag = chalkPipe(photoColor)(
					terminalLink(
						'[图]',
						status?.photo?.largeurl.replaceAll(/@.+\..+$/g, '') ?? '',
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
