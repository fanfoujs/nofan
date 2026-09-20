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
		const {verbose, photo, clipboard, repl, consoleType, ...parameters} =
			options;

		this.photo = photo;
		this.clipboard = clipboard;
		this.repl = repl;
		this.consoleType = consoleType;
		this.params = {};

		for (const [key, value] of Object.entries(parameters)) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			this.params[justSnakeCase(key)] = value;
		}
	}

	async initConfig(options?: {verbose?: boolean}) {
		try {
			this.config = await util.getConfig();
			this.verbose = this.config.VERBOSE ?? options?.verbose;
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
		const login = async (username_: string, password_: string) => {
			const ff = new Fanfou({
				consumerKey: config.CONSUMER_KEY,
				consumerSecret: config.CONSUMER_SECRET,
				username: username_,
				password: password_,
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
					/* eslint-disable @typescript-eslint/naming-convention -- Config file uses this format. */
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
		const configUser = config.USER;
		if (!configUser) {
			return;
		}

		const account = await util.getAccount();
		// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
		delete account[configUser];
		config.USER = Object.keys(account)[0] ?? '';
		await util.setConfig(config);
		await util.setAccount(account);
		spinner.succeed('Logout succeed!');
	}

	async configure() {
		const {config} = this;
		const settings: Settings = await configPrompt(config);

		config.CONSUMER_KEY =
			settings.consumerKey || util.defaultConfig.CONSUMER_KEY;
		config.CONSUMER_SECRET =
			settings.consumerSecret || util.defaultConfig.CONSUMER_SECRET;
		config.DISPLAY_COUNT = settings.displayCount;
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
		const statuses = await this.#get('/statuses/home_timeline', {
			count,
			format: 'html',
			...this.params,
		});
		this.#displayTimeline(statuses, {verbose: this.verbose});
	}

	async publicTimeline() {
		const {DISPLAY_COUNT: count} = this.config;
		const statuses = await this.#get('/statuses/public_timeline', {
			count,
			format: 'html',
			...this.params,
		});
		this.#displayTimeline(statuses, {verbose: this.verbose});
	}

	async contextTimeline(id: string) {
		const statuses = await this.#get('/statuses/context_timeline', {
			id,
			format: 'html',
			...this.params,
		});
		this.#displayTimeline(statuses, {verbose: this.verbose});
	}

	async searchTimeline(q: string) {
		const {DISPLAY_COUNT: count} = this.config;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		const uri = this.params.id
			? '/search/user_timeline'
			: '/search/public_timeline';
		const statuses = await this.#get(uri, {
			q,
			count,
			format: 'html',
			...this.params,
		});
		this.#displayTimeline(statuses, {verbose: this.verbose});
	}

	async trendsTimeline() {
		const [{trends: hotTrends}, savedTrends] = [
			await this.#get<GetTrendsResult>('/trends/list'),
			await this.#get<Trend[]>('/saved_searches/list'),
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
		const statuses = await this.#get('/statuses/user_timeline', {
			id,
			count,
			format: 'html',
			...this.params,
		});
		this.#displayTimeline(statuses, {verbose: this.verbose});
	}

	async update(text: string) {
		await this.#post('/statuses/update', {status: text, ...this.params});
		spinner.succeed('Sent!');
	}

	async upload(text: string) {
		const {photo, clipboard} = this;
		if (photo) {
			await this.#upload(photo, text);
		} else if (clipboard) {
			// eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
			switch (process.platform) {
				case 'darwin': {
					const temporaryFilepath = await util.getTemporaryImagePathMacos();
					await this.#upload(temporaryFilepath, text);
					break;
				}

				case 'win32': {
					const temporaryFilepath = await util.getTemporaryImagePathWindows();
					await this.#upload(temporaryFilepath, text);
					break;
				}

				// @ts-expect-error: Only support WSL
				case 'linux': {
					if (isWsl) {
						process.env['NPS'] = 'powershell.exe';
						const temporaryFilepath = await util.getTemporaryImagePathWindows();
						await this.#upload(temporaryFilepath, text);
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
		const statuses = await this.#get<Status[]>('/statuses/user_timeline', {});
		// @ts-expect-error: Assume the first status is the latest one
		await this.#post<Status>('/statuses/destroy', {id: statuses[0].id});
		spinner.succeed('Deleted!');
	}

	async mentions() {
		const {DISPLAY_COUNT: count} = this.config;
		const statuses = await this.#get('/statuses/mentions', {
			count,
			format: 'html',
			...this.params,
		});
		this.#displayTimeline(statuses, {verbose: this.verbose});
	}

	async me() {
		const {DISPLAY_COUNT: count} = this.config;
		const statuses = await this.#get('/statuses/user_timeline', {
			count,
			format: 'html',
			...this.params,
		});
		this.#displayTimeline(statuses, {verbose: this.verbose});
	}

	async reply(id: string, text: string) {
		const status: Status = await this.#getStatus(id);
		const replyText = `@${status?.user?.name ?? ''} ${text}`.trim();
		await this.#post('/statuses/update', {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			in_reply_to_status_id: id,
			status: replyText,
			...this.params,
		});
		spinner.succeed('Sent!');
	}

	async repost(id: string, text: string) {
		const status: Status = await this.#getStatus(id);
		const repostText = `${text} 转@${status?.user?.name ?? ''} ${getPlainText(
			getEntities(status.text),
		)}`.trim();
		await this.#post('/statuses/update', {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			repost_status_id: id,
			status: repostText,
			...this.params,
		});
		spinner.succeed('Sent!');
	}

	async show(id: string) {
		const status = await this.#getStatus(id);
		this.#displayTimeline([status], {verbose: this.verbose});
	}

	async get<T>(uri: string): Promise<T> {
		return this.#get<T>(uri, this.params);
	}

	async post<T>(uri: string): Promise<T> {
		return this.#post<T>(uri, this.params);
	}

	// @ts-expect-error: We've handled undefined return by throwing error
	// eslint-disable-next-line unicorn/consistent-class-member-order
	async #get<T>(uri: string, parameters?: any): Promise<T> {
		const {config} = this;
		const account = await util.getAccount();
		let user = account[config.USER ?? ''];
		if (!user) {
			for (const name in account) {
				if (account[name] !== undefined) {
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
			this.#handleError(error);
		}
	}

	// @ts-expect-error: We've handled undefined return by throwing error
	async #post<T>(uri: string, parameters: any): Promise<T> {
		const {config} = this;
		const account = await util.getAccount();
		let user = account[config.USER ?? ''];

		if (!user) {
			for (const name in account) {
				if (account[name] !== undefined) {
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
			this.#handleError(error);
		}
	}

	async #getStatus(id: string) {
		return this.#get<Status>('/statuses/show', {id, format: 'html'});
	}

	// @ts-expect-error: We've handled undefined return by throwing error
	async #upload(path: string, status: string): Promise<Status> {
		const {config} = this;
		const account = await util.getAccount();
		let user = account[config.USER ?? ''];
		if (!user) {
			for (const name in account) {
				if (account[name] !== undefined) {
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
			this.#handleError(error);
		}
	}

	#handleError(error: unknown) {
		spinner.fail(error instanceof Error ? error.message : 'Unknown error');
		if (this.repl) {
			showInRepl(error);
		} else {
			process.exit(1);
		}
	}

	// eslint-disable-next-line complexity
	#displayTimeline(timeline: any, options: any) {
		const {config} = this;

		spinner.stop();

		const {verbose: isVerbose = false} = options as {verbose?: boolean};
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

		const formatEntityText = (item: StatusEntity) => {
			// eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
			switch (item.type) {
				case 'at': {
					return (
						util.formatEntityText(item, atColor, highlightColor, isVerbose) ||
						chalkPipe(atColor)(
							isVerbose ? `${item.text}:${item.id}` : item.text,
						)
					);
				}

				case 'link': {
					return (
						util.formatEntityText(item, linkColor, highlightColor, isVerbose) ||
						chalkPipe(linkColor)(item.text)
					);
				}

				case 'tag': {
					return (
						util.formatEntityText(item, tagColor, highlightColor, isVerbose) ||
						chalkPipe(tagColor)(item.text)
					);
				}

				default: {
					return (
						util.formatEntityText(item, textColor, highlightColor, isVerbose) ||
						chalkPipe(textColor)(item.text)
					);
				}
			}
		};

		for (const status of timeline as Status[]) {
			let text = '';
			for (const item of getEntities(status.text)) {
				text += formatEntityText(item);
			}

			const name =
				chalkPipe(textColor)('[') +
				chalkPipe(nameColor)(
					isVerbose
						? `${status?.user?.name}(${status?.user?.id}):${status.id}`
						: status?.user?.name,
				) +
				chalkPipe(textColor)(']');
			if (hasPhotoTag && status.photo) {
				const largeUrl = status?.photo?.largeurl ?? '';
				const photoUrl = largeUrl.includes('@')
					? largeUrl.slice(0, largeUrl.indexOf('@'))
					: largeUrl;
				const photoTag = chalkPipe(photoColor)(
					terminalLink('[图]', photoUrl, {
						fallback: (label) => label,
					}),
				);
				text += text.length > 0 ? ` ${photoTag}` : photoTag;
			}

			if (hasTimeTag) {
				const statusTimeAgo = chalkPipe(timeagoColor)(
					`(${
						isVerbose
							? moment(new Date(status.createdAt))
									.local()
									.format('YYYY-MM-DD HH:mm:ss')
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
		const {repl, consoleType} = this;
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
