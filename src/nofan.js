#!/usr/bin/env node
'use strict';

const fs = require('fs');
const importLazy = require('import-lazy')(require);

const justSnakeCase = importLazy('just-snake-case');
const terminalLink = importLazy('terminal-link');
const chalkPipe = importLazy('chalk-pipe');
const TimeAgo = importLazy('timeago.js');
const Fanfou = importLazy('fanfou-sdk');
const inquirer = importLazy('inquirer');
const moment = importLazy('moment');
const chalk = importLazy('chalk');
const ora = importLazy('ora');
const util = importLazy('./util');
const colorsPrompt = importLazy('./prompts/colors');
const configPrompt = importLazy('./prompts/config');
const loginPrompt = importLazy('./prompts/login');
const switchPrompt = importLazy('./prompts/switch');
const trendsPrompt = importLazy('./prompts/trends');

class Nofan {
	constructor(opt = {}) {
		const {verbose, photo, clipboard, ...params} = opt;
		this.verbose = verbose;
		this.photo = photo;
		this.clipboard = clipboard;
		this.params = {};
		Object.keys(params).forEach(key => {
			this.params[justSnakeCase(key)] = params[key];
		});

		try {
			this.config = util.getConfig();
		} catch (err) {
			process.spinner.fail(err.message);
			process.exit();
		}
	}

	async login(username, password) {
		const {config} = this;
		const login = async (username, password) => {
			const ff = new Fanfou({
				consumerKey: config.CONSUMER_KEY,
				consumerSecret: config.CONSUMER_SECRET,
				username,
				password,
				protocol: config.SSL ? 'https:' : 'http:',
				apiDomain: config.API_DOMAIN,
				oauthDomain: config.OAUTH_DOMAIN,
				hooks: {
					baseString: str => config.SSL ? str.replace('https', 'http') : str
				}
			});

			try {
				const token = await ff.xauth();
				config.USER = username;
				util.createNofanDir();
				util.setConfig(config);
				const account = util.getAccount();
				account[username] = {
					CONSUMER_KEY: config.CONSUMER_KEY,
					CONSUMER_SECRET: config.CONSUMER_SECRET,
					OAUTH_TOKEN: token.oauthToken,
					OAUTH_TOKEN_SECRET: token.oauthTokenSecret
				};
				util.setAccount(account);
				process.spinner.succeed('Login succeed!');
			} catch (err) {
				process.spinner.fail(err.message);
				process.exit(1);
			}
		};

		if (username && password) {
			process.spinner = ora('Logging in...').start();
			login(username, password);
		} else {
			const user = await inquirer.prompt(loginPrompt({hasName: Boolean(username)}));
			if (username) {
				user.username = username;
			}

			process.spinner = ora('Logging in').start();
			login(user.username, user.password);
		}
	}

	async logout() {
		process.spinner = ora('Logging out').start();
		const {config} = this;
		if (config.USER) {
			const account = util.getAccount();
			delete account[config.USER];
			util.setAccount(account);
			process.spinner.succeed('Logout succeed!');
		}
	}

	async config(showAll) {
		const {config} = this;
		const settings = await inquirer.prompt(configPrompt(this.config, showAll));

		config.CONSUMER_KEY = settings.key || util.defaultConfig.CONSUMER_KEY;
		config.CONSUMER_SECRET = settings.secret || util.defaultConfig.CONSUMER_SECRET;
		config.DISPLAY_COUNT = settings.display_count;
		config.TIME_TAG = settings.display.indexOf('time_tag') !== -1;
		config.PHOTO_TAG = settings.display.indexOf('photo_tag') !== -1;
		config.SSL = settings.display.indexOf('use_https') !== -1;

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

	async switchUser(id) {
		const {config} = this;
		const account = util.getAccount();

		if (id) {
			if (account[id]) {
				config.USER = id;
				util.setConfig(config);
				process.spinner = ora().succeed(`Switch account to ${chalk.blue.bold(id)}`);
			} else {
				process.spinner = ora().info(`${chalk.blue.bold(id)} needs login`);
				process.exit(1);
			}
		} else {
			const currentName = config.USER;
			const choices = Object.keys(account).map(name => {
				if (name === currentName) {
					return ({name, disabled: chalk.green('current')});
				}

				return name;
			});
			if (choices.length > 1) {
				const user = await inquirer.prompt(switchPrompt(choices));
				config.USER = user.username;
				util.setConfig(config);
			} else {
				process.spinner = ora().info('No more account');
				process.exit(1);
			}
		}
	}

	async homeTimeline() {
		const {count} = this.config;
		const statuses = await this._get('/statuses/home_timeline', {count, format: 'html', ...this.params});
		this._displayTimeline(statuses, {verbose: this.verbose});
	}

	async publicTimeline() {
		const {count} = this.config;
		const statuses = await this._get('/statuses/public_timeline', {count, format: 'html', ...this.params});
		this._displayTimeline(statuses, {verbose: this.verbose});
	}

	async searchTimeline(q) {
		const {count} = this.config;
		const uri = this.params.id ? '/search/user_timeline' : '/search/public_timeline';
		const statuses = await this._get(uri, {q, count, format: 'html', ...this.params});
		this._displayTimeline(statuses, {verbose: this.verbose});
	}

	async trendsTimeline() {
		const [{trends: hotTrends}, savedTrends] = [
			await this._get('/trends/list'),
			await this._get('/saved_searches/list')
		];
		if (hotTrends.length + savedTrends.length > 0) {
			process.spinner.stop();
			const {trends: trend} = await inquirer.prompt(trendsPrompt(hotTrends, savedTrends));
			process.spinner.start('Fetching');
			await this.searchTimeline(trend);
		} else {
			process.spinner.fail('No trends exist');
			process.exit(1);
		}
	}

	async userTimeline(id) {
		const {count} = this.config;
		const statuses = await this._get('/statuses/user_timeline', {id, count, format: 'html', ...this.params});
		this._displayTimeline(statuses, {verbose: this.verbose});
	}

	async update(text) {
		await this._post('/statuses/update', {status: text, ...this.params});
		process.spinner.succeed('Sent!');
	}

	async upload(text) {
		const {photo, clipboard} = this;
		if (photo) {
			await this._upload(photo, text);
		} else if (clipboard) {
			const tempFilepath = await util.getTempImagePath();
			await this._upload(tempFilepath, text);
		}

		process.spinner.succeed('Sent!');
	}

	async undo() {
		const statuses = await this._get('/statuses/user_timeline', {});
		await this._post('/statuses/destroy', {id: statuses[0].id});
		process.spinner.succeed('Deleted!');
	}

	async mentions() {
		const {count} = this.config;
		const statuses = await this._get('/statuses/mentions', {count, format: 'html', ...this.params});
		this._displayTimeline(statuses, {verbose: this.verbose});
	}

	async me() {
		const {count} = this.config;
		const statuses = await this._get('/statuses/user_timeline', {count, format: 'html', ...this.params});
		this._displayTimeline(statuses, {verbose: this.verbose});
	}

	async reply(id, text) {
		const status = await this._getStatus(id);
		const replyText = `@${status.user.name} ${text}`.trim();
		await this._post('/statuses/update', {in_reply_to_status_id: id, status: replyText, ...this.params});
		process.spinner.succeed('Sent!');
	}

	async repost(id, text) {
		const status = await this._getStatus(id);
		const repostText = `${text} 转@${status.user.name} ${status.plain_text}`.trim();
		await this._post('/statuses/update', {repost_status_id: id, status: repostText, ...this.params});
		process.spinner.succeed('Sent!');
	}

	async show(id) {
		const status = await this._getStatus(id);
		this._displayTimeline([status], {verbose: this.verbose});
	}

	async get(uri) {
		return this._get(uri, this.params);
	}

	async post(uri) {
		return this._post(uri, this.params);
	}

	async _get(uri, params) {
		const {config} = this;
		const account = util.getAccount();
		let user = account[config.USER];
		if (!user) {
			for (const name in account) {
				if (account.name) {
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

		const ff = this.initFanfou(user, config);
		try {
			const res = await ff.get(uri, params);
			return res;
		} catch (err) {
			Nofan._handleError(err);
		}
	}

	async _post(uri, params) {
		const {config} = this;
		const account = util.getAccount();
		let user = account[config.USER];

		if (!user) {
			for (const name in account) {
				if (account.name) {
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

		const ff = this.initFanfou(user, config);
		try {
			const res = await ff.post(uri, params);
			return res;
		} catch (err) {
			Nofan._handleError(err);
		}
	}

	async _getStatus(id) {
		return this._get('/statuses/show', {id, format: 'html'});
	}

	async _upload(path, status) {
		const {config} = this;
		const account = util.getAccount();
		let user = account[config.USER];
		if (!user) {
			for (const name in account) {
				if (account.name) {
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
		const ff = this.initFanfou(user, config);

		try {
			const res = await ff.post('/photos/upload', {photo: fs.createReadStream(path), status});
			return res;
		} catch (err) {
			Nofan._handleError(err);
		}
	}

	static _handleError(err) {
		process.spinner.fail(err.message);
		process.exit(1);
	}

	_displayTimeline(timeline, opt) {
		const {config} = this;

		if (process.spinner) {
			process.spinner.stop();
		}

		const {verbose = false} = opt;
		const hasTimeTag = config.TIME_TAG;
		const hasPhotoTag = config.PHOTO_TAG;
		const {COLORS: colors} = config || util.defaultConfig;

		const {
			name: nameColor,
			text: textColor,
			at: atColor,
			link: linkColor,
			tag: tagColor,
			photo: photoColor,
			timeago: timeagoColor,
			highlight: highlightColor
		} = colors;

		const parseHighlight = (style, item) => {
			let appendText = '';

			if (verbose && item.type === 'at') {
				appendText = chalkPipe(style)(`:${item.id}`);
			}

			if (item.bold_arr) {
				const highlightText = item.bold_arr.map(keyword => {
					if (keyword.bold) {
						const boldColor = `${style}.${highlightColor}`;
						return chalkPipe(boldColor)(keyword.text);
					}

					return chalkPipe(style)(keyword.text);
				}).join('');

				return highlightText + appendText;
			}

			return false;
		};

		timeline.forEach(status => {
			let text = '';
			status.txt.forEach(item => {
				switch (item.type) {
					case 'at':
						text += parseHighlight(atColor, item) || chalkPipe(atColor)(verbose ? `${item.text}:${item.id}` : item.text);
						break;
					case 'link':
						text += parseHighlight(linkColor, item) || chalkPipe(linkColor)(item.text);
						break;
					case 'tag':
						text += parseHighlight(tagColor, item) || chalkPipe(tagColor)(item._text);
						break;
					default:
						text += parseHighlight(textColor, item) || chalkPipe(textColor)(item._text);
						break;
				}
			});

			const name = chalkPipe(textColor)('[') +
				chalkPipe(nameColor)(verbose ? `${status.user.name}:${status.id}` : status.user.name) +
				chalkPipe(textColor)(']');
			if (status.photo && hasPhotoTag) {
				const photoTag = chalkPipe(photoColor)(terminalLink('[图]', status.photo.originurl, {fallback: text => text}));
				if (text.length > 0) {
					text += ` ${photoTag}`;
				} else {
					text += photoTag;
				}
			}

			if (hasTimeTag) {
				const statusTimeAgo = chalkPipe(timeagoColor)(
					`(${verbose ?
						`${moment(new Date(status.created_at))
							.local()
							.format('YYYY-MM-DD HH:mm:ss')}` :
						new TimeAgo().format(status.created_at)})`
				);
				console.log(`${name} ${text} ${statusTimeAgo}`);
			} else {
				console.log(`${name} ${text}`);
			}
		});
	}

	static normalDisplay(item) {
		process.spinner.succeed();
		console.log(item);
	}

	initFanfou(user) {
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
				baseString: str => config.SSL ? str.replace('https', 'http') : str
			}
		});
	}
}

module.exports = Nofan;
