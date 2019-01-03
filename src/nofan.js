#!/usr/bin/env node
'use strict';

const fs = require('fs');
const importLazy = require('import-lazy')(require);

const gradient = importLazy('gradient-string');
const chalkPipe = importLazy('chalk-pipe');
const TimeAgo = importLazy('timeago.js');
const Fanfou = importLazy('fanfou-sdk');
const inquirer = importLazy('inquirer');
const figlet = importLazy('figlet');
const moment = importLazy('moment');
const boxen = importLazy('boxen');
const chalk = importLazy('chalk');
const pangu = importLazy('pangu');
const ora = importLazy('ora');
const util = importLazy('./util');
const colorsPrompt = importLazy('./prompts/colors');
const configPrompt = importLazy('./prompts/config');
const loginPrompt = importLazy('./prompts/login');
const switchPrompt = importLazy('./prompts/switch');
const trendsPrompt = importLazy('./prompts/trends');

class Nofan {
	static async login(username, password) {
		const config = await util.getConfig();
		const login = async (username, password) => {
			const ff = new Fanfou({
				consumerKey: config.CONSUMER_KEY,
				cosnumerSecret: config.CONSUMER_SECRET,
				username,
				password,
				protocol: config.SSL ? 'https:' : 'http:',
				apiDomain: config.API_DOMAIN,
				oauthDomain: config.OAUTH_DOMAIN,
				fakeHttps: config.FAKE_HTTPS || false
			});
			try {
				const token = await ff.xauth();
				config.USER = username;
				await util.setConfig(config);
				const account = await util.getAccount();
				account[username] = {
					CONSUMER_KEY: config.CONSUMER_KEY,
					CONSUMER_SECRET: config.CONSUMER_SECRET,
					OAUTH_TOKEN: token.oauthToken,
					OAUTH_TOKEN_SECRET: token.oauthTokenSecret
				};
				await util.setAccount(account);
				process.spinner.succeed('Login succeed!');
			} catch (err) {
				process.spinner.fail(pangu.spacing(err.message));
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

	static async logout() {
		process.spinner = ora('Logging out').start();
		const config = await util.getConfig();
		if (config.USER) {
			const account = await util.getAccount();
			delete account[config.USER];
			await util.setAccount(account);
			process.spinner.succeed('Logout succeed!');
		}
	}

	static async config(key, secret, showAll) {
		const config = await util.getConfig();
		if (key && secret) {
			config.CONSUMER_KEY = key;
			config.CONSUMER_SECRET = secret;
			await util.createNofanDir();
			await util.setConfig(config);
		} else {
			const settings = await inquirer.prompt(configPrompt(config, showAll));
			config.CONSUMER_KEY = settings.key || '';
			config.CONSUMER_SECRET = settings.secret || '';
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
			if (settings.https) {
				config.FAKE_HTTPS = settings.https.indexOf('fake_https') !== -1;
			}
			await util.createNofanDir();
			await util.setConfig(config);
		}
	}

	static async colors() {
		const config = await util.getConfig();
		config.COLORS = config.COLORS || {};
		const paints = await inquirer.prompt(colorsPrompt(config));
		const colors = {...paints};
		config.COLORS = colors;
		await util.createNofanDir();
		await util.setConfig(config);
	}

	static async switchUser(id) {
		const [config, account] = [
			await util.getConfig(),
			await util.getAccount()
		];
		if (id) {
			if (account[id]) {
				config.USER = id;
				await util.setConfig(config);
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
				await util.setConfig(config);
			} else {
				process.spinner = ora().info('No more account');
				process.exit(1);
			}
		}
	}

	static async homeTimeline(options) {
		const {count, timeAgo, noPhotoTag} = await Nofan.getConfig(options);
		const statuses = await Nofan._get('/statuses/home_timeline', {count, format: 'html'});
		Nofan._displayTimeline(statuses, {timeAgo, noPhotoTag});
	}

	static async publicTimeline(options) {
		const {count, timeAgo, noPhotoTag} = await Nofan.getConfig(options);
		const statuses = await Nofan._get('/statuses/public_timeline', {count, format: 'html'});
		Nofan._displayTimeline(statuses, {timeAgo, noPhotoTag});
	}

	static async searchTimeline(q, options) {
		const {count, timeAgo, noPhotoTag} = await Nofan.getConfig(options);
		const statuses = await Nofan._get('/search/public_timeline', {q, count, format: 'html'});
		Nofan._displayTimeline(statuses, {timeAgo, noPhotoTag});
	}

	static async trendsTimeline(options) {
		options = options || {};
		const [{trends: hotTrends}, savedTrends] = [
			await Nofan._get('/trends/list'),
			await Nofan._get('/saved_searches/list')
		];
		if (hotTrends.length + savedTrends.length > 0) {
			process.spinner.stop();
			const {trends: trend} = await inquirer.prompt(trendsPrompt(hotTrends, savedTrends));
			process.spinner.start('Fetching');
			await Nofan.searchTimeline(trend, options);
		} else {
			process.spinner.fail('No trends exist');
			process.exit(1);
		}
	}

	static async userTimeline(id, options) {
		const {count, timeAgo, noPhotoTag} = await Nofan.getConfig(options);
		const statuses = await Nofan._get('/statuses/user_timeline', {id, count, format: 'html'});
		Nofan._displayTimeline(statuses, {timeAgo, noPhotoTag, verbose: Boolean(options.verbose)});
	}

	static async getConfig(options) {
		options = options || {};
		process.NOFAN_CONFIG = await util.getConfig();
		const count = options.count || process.NOFAN_CONFIG.DISPLAY_COUNT || 10;
		const timeAgo = options.time_ago || false;
		const noPhotoTag = options.no_photo_tag || false;
		return {
			count,
			timeAgo,
			noPhotoTag
		};
	}

	static async update(text) {
		await Nofan._post('/statuses/update', {status: text});
		process.spinner.succeed('Sent!');
	}

	static async upload(options, text) {
		const {photo, clipboard} = options;
		if (photo) {
			await Nofan._upload(photo, text);
		} else if (clipboard) {
			const tempFilepath = await util.getTempImagePath();
			await Nofan._upload(tempFilepath, text);
		}
		process.spinner.succeed('Sent!');
	}

	static async undo() {
		const statuses = await Nofan._get('/statuses/user_timeline', {});
		await Nofan._post('/statuses/destroy', {id: statuses[0].id});
		process.spinner.succeed('Deleted!');
	}

	static async mentions(options) {
		const {count, timeAgo, noPhotoTag} = await Nofan.getConfig(options);
		const statuses = await Nofan._get('/statuses/mentions', {count, format: 'html'});
		Nofan._displayTimeline(statuses, {timeAgo, noPhotoTag});
	}

	static async me(options) {
		const {count, timeAgo, noPhotoTag} = await Nofan.getConfig(options);
		const statuses = await Nofan._get('/statuses/user_timeline', {count, format: 'html'});
		Nofan._displayTimeline(statuses, {timeAgo, noPhotoTag});
	}

	static async _get(uri, params) {
		const config = process.NOFAN_CONFIG ? process.NOFAN_CONFIG : await util.getConfig();
		const account = await util.getAccount();
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
		const ff = Nofan.initFanfou(user, config);
		try {
			const res = await ff.get(uri, params);
			return res;
		} catch (err) {
			Nofan._handleError(err, config);
		}
	}

	static async _post(uri, params) {
		const config = process.NOFAN_CONFIG ? process.NOFAN_CONFIG : await util.getConfig();
		const account = await util.getAccount();
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
		const ff = Nofan.initFanfou(user, config);
		try {
			const res = await ff.post(uri, params);
			return res;
		} catch (err) {
			Nofan._handleError(err, config);
		}
	}

	static async _upload(path, status) {
		const config = process.NOFAN_CONFIG ? process.NOFAN_CONFIG : await util.getConfig();
		const account = await util.getAccount();
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
		const ff = Nofan.initFanfou(user, config);
		try {
			const res = await ff.upload('/photos/upload', {photo: fs.createReadStream(path), status});
			return res;
		} catch (err) {
			Nofan._handleError(err, config);
		}
	}

	static _handleError(err, config) {
		const expectHttpError = /Invalid signature\. Expected basestring is (GET|POST)&http%3A%2F%2F/;
		if (
			config.SSL &&
			!config.FAKE_HTTS &&
			err &&
			typeof err.message === 'string' &&
			err.message.match(expectHttpError)
		) {
			const tip = `Please try ${chalk.green('`nofan config -a`')} to switch ${chalk.green('`fake_https`')} on`;
			err.message += `\n\n${boxen(tip, {padding: 1})}`;
		}
		process.spinner.fail(pangu.spacing(err.message));
		process.exit(1);
	}

	static _displayTimeline(timeline, opt) {
		const config = process.NOFAN_CONFIG;
		if (process.spinner) {
			process.spinner.stop();
		}
		let {timeAgo: timeAgoTag, noPhotoTag, verbose} = opt;
		timeAgoTag = timeAgoTag || config.TIME_TAG;
		noPhotoTag = noPhotoTag || !config.PHOTO_TAG;
		const {COLORS: colors = {}} = config;
		const {
			name: nameColor = 'green',
			text: textColor,
			at: atColor = 'blue',
			link: linkColor = 'blue',
			tag: tagColor = 'blue',
			photo: photoColor = 'blue',
			timeago: timeagoColor = 'green',
			highlight: highlightColor = 'bold'
		} = colors;
		const parseHighlight = (style, item) => {
			if (item.bold_arr) {
				return item.bold_arr.map(keyword => {
					if (keyword.bold) {
						return chalkPipe(`${style}.${highlightColor}`)(keyword.text);
					}
					return chalkPipe(style)(keyword.text);
				}).join('');
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
			const name = chalkPipe(textColor)('[') + chalkPipe(nameColor)(verbose ? `${status.user.name}:${status.id}` : status.user.name) + chalkPipe(textColor)(']');
			if (status.photo && !noPhotoTag) {
				const photoTag = chalkPipe(photoColor)('[图]');
				if (text.length > 0) {
					text += ` ${photoTag}`;
				} else {
					text += photoTag;
				}
			}
			if (timeAgoTag) {
				const statusTimeAgo = chalkPipe(timeagoColor)(`(${verbose ? `${moment(new Date(status.created_at)).local().format('YYYY-MM-DD HH:mm:ss')}` : new TimeAgo().format(status.created_at)})`);
				console.log(`${name} ${text} ${statusTimeAgo}`);
			} else {
				console.log(`${name} ${text}`);
			}
		});
	}

	static initFanfou(user, config) {
		return new Fanfou({
			consumerKey: user.CONSUMER_KEY,
			consumerSecret: user.CONSUMER_SECRET,
			oauthToken: user.OAUTH_TOKEN,
			oauthTokenSecret: user.OAUTH_TOKEN_SECRET,
			protocol: config.SSL ? 'https:' : 'http:',
			apiDomain: config.API_DOMAIN,
			oauthDomain: config.OAUTH_DOMAIN,
			fakeHttps: config.FAKE_HTTPS || false
		});
	}

	static version() {
		const banner = gradient.rainbow(figlet.textSync('Nofan', {
			font: 'Small Slant'
		}));
		const nofanVersion = chalk.cyanBright(`nofan: ${require('../package').version}`);
		const sdkVersion = chalk.green(`fanfou-sdk: ${util.sdkVersion()}`);
		const streamerVersion = chalk.blueBright(`fanfou-streamer: ${require('fanfou-streamer/package').version}`);
		const version = `${banner}\n${nofanVersion}\n${sdkVersion}\n${streamerVersion}`;
		return version;
	}
}

module.exports = Nofan;
