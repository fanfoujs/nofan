#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import chalkPipe from 'chalk-pipe';
import boxen from 'boxen';
import execa from 'execa';
import Shell from 'node-powershell';

const configPath =
	process.env.NODE_ENV === 'test' ? '/.nofan-test/' : '/.nofan/';
const homedir = os.homedir();

export const defaultConfig = {
	CONSUMER_KEY: '13456aa784cdf7688af69e85d482e011',
	CONSUMER_SECRET: 'f75c02df373232732b69354ecfbcabea',
	DISPLAY_COUNT: 10,
	TIME_TAG: true,
	PHOTO_TAG: true,
	SSL: true,
	API_DOMAIN: 'api.fanfou.com',
	OAUTH_DOMAIN: 'fanfou.com',
	VERBOSE: false,
	COLORS: {
		name: 'green',
		text: '#cccccc',
		at: 'cyan',
		link: 'cyan.underline',
		tag: 'orange.bold',
		photo: 'grey',
		timeago: 'dim.green.italic',
		highlight: 'bgYellow.black'
	}
};

export const createNofanDir = () => {
	try {
		fs.mkdirSync(`${homedir}${configPath}`);
	} catch {}
};

export const createJsonFile = (filename, content) => {
	const filePath = `${homedir}${configPath}${filename}.json`;
	return fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
};

export const readJsonFile = (filename) => {
	const filePath = `${homedir}${configPath}${filename}.json`;
	return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

export const getConfig = () => {
	try {
		return readJsonFile('config');
	} catch {
		return defaultConfig;
	}
};

export const getAccount = () => {
	try {
		return readJsonFile('account');
	} catch {
		return {};
	}
};

export const setConfig = (config) => {
	return createJsonFile('config', config);
};

export const setAccount = (account) => {
	return createJsonFile('account', account);
};

export const getTemporaryImagePath_Windows = async () => {
	const temporaryPath = homedir + configPath + 'temp';
	const filepath = path.join(temporaryPath, 'temp.png');

	try {
		fs.mkdirSync(temporaryPath);
	} catch {}

	const ps = new Shell({
		executionPolicy: 'Bypass',
		noProfile: true
	});

	ps.addCommand('$img = Get-Clipboard -Format Image');
	ps.addCommand(`$img.save("${filepath}")`);

	try {
		await ps.invoke();
	} catch (error) {
		if (
			error.message &&
			error.message.match(
				'You cannot call a method on a null-valued expression.'
			)
		) {
			process.spinner.fail('No image data found on the clipboard');
			process.exit(1);
		} else {
			console.log(error && error.message);
			process.exit(1);
		}
	} finally {
		ps.dispose();
	}

	return filepath;
};

export const getTemporaryImagePath_macOS = async () => {
	const temporaryPath = homedir + configPath + 'temp';
	const filepath = path.join(temporaryPath, 'temp.png');

	try {
		fs.mkdirSync(temporaryPath);
	} catch {}

	try {
		await execa('pngpaste', [filepath]);
	} catch (error) {
		if (error.code === 'ENOENT') {
			const tip = `Please use ${chalkPipe('green')(
				'`brew install pngpaste`'
			)} to solve`;
			process.spinner.fail(
				`Required ${chalkPipe('green')('`pngpaste`')}\n\n` +
					boxen(tip, {padding: 1})
			);
			process.exit(1);
		}

		process.spinner.fail(error.stderr.trim());
		process.exit(1);
	}

	return filepath;
};
