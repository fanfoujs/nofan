#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const importLazy = require('import-lazy')(require);

const chalk = importLazy('chalk');
const boxen = importLazy('boxen');
const homedir = importLazy('homedir');
const execa = importLazy('execa');

const configPath = process.env.NODE_ENV === 'test' ? '/.nofan-test/' : '/.nofan/';

const defaultConfig = {
	CONSUMER_KEY: '13456aa784cdf7688af69e85d482e011',
	CONSUMER_SECRET: 'f75c02df373232732b69354ecfbcabea',
	DISPLAY_COUNT: 10,
	TIME_TAG: false,
	PHOTO_TAG: true,
	SSL: false,
	API_DOMAIN: 'api.fanfou.com',
	OAUTH_DOMAIN: 'fanfou.com',
	COLORS: {
		name: 'green',
		text: '',
		at: 'blue',
		link: 'blue',
		tag: 'blue',
		photo: 'blue',
		timeago: 'green',
		highlight: 'bold'
	}
};

function createNofanDir() {
	return new Promise(resolve => {
		fs.mkdir(`${homedir()}${configPath}`, () => {
			resolve();
		});
	});
}

function createJsonFile(filename, content) {
	return new Promise((resolve, reject) => {
		const filePath = `${homedir()}${configPath}${filename}.json`;
		fs.writeFile(filePath, JSON.stringify(content, null, 2), 'utf8', e => {
			if (e) {
				reject(chalk.red(`create file '${filePath}' failed`));
			} else {
				resolve();
			}
		});
	});
}

function readJsonFile(filename) {
	return new Promise((resolve, reject) => {
		const filePath = `${homedir()}${configPath}${filename}.json`;
		fs.open(filePath, 'r', err => {
			if (err) {
				if (err.code === 'ENOENT') {
					reject(chalk.red(`file '${filePath}' does not exist`));
				}

				reject(chalk.red(`read file '${filePath}' failed`));
			} else {
				resolve(require(filePath));
			}
		});
	});
}

function readSDKVersion() {
	return require('fanfou-sdk/package').version;
}

async function getConfig() {
	try {
		return await readJsonFile('config');
	} catch (err) {
		return defaultConfig;
	}
}

async function getAccount() {
	try {
		return await readJsonFile('account');
	} catch (err) {
		return {};
	}
}

function setConfig(config) {
	createJsonFile('config', config);
}

function setAccount(account) {
	createJsonFile('account', account);
}

async function getTempImagePath() {
	const tempPath = homedir() + configPath + 'temp';
	const filepath = path.join(tempPath, 'temp.png');
	if (process.platform !== 'darwin') {
		process.spinner.fail('Upload from clipboard only available in macOS');
		process.exit(1);
	}

	try {
		fs.mkdirSync(tempPath);
	} catch (err) {}

	try {
		await execa('pngpaste', [filepath]);
	} catch (err) {
		if (err.code === 'ENOENT') {
			const tip = `Please use ${chalk.green('`brew install pngpaste`')} to solve`;
			process.spinner.fail(`Required ${chalk.green('`pngpaste`')}\n\n` + boxen(tip, {padding: 1}));
			process.exit(1);
		}

		process.spinner.fail(err.stderr.trim());
		process.exit(1);
	}

	return filepath;
}

module.exports = {
	defaultConfig,
	createNofanDir,
	getConfig,
	getAccount,
	setConfig,
	setAccount,
	sdkVersion: readSDKVersion,
	getTempImagePath
};
