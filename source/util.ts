import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import chalkPipe from 'chalk-pipe';
import {ExecaError, execa} from 'execa';
import Shell from 'node-powershell';
import * as spinner from './spinner.js';
import {type AccountDict, type Config} from './types.js';

export const configPath =
	process.env['NODE_ENV'] === 'test' ? '/.nofan-test/' : '/.nofan/';
export const homedir = os.homedir();

export const defaultConfig = {
	/* eslint-disable @typescript-eslint/naming-convention */
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
		highlight: 'bgYellow.black',
	},
	/* eslint-enable @typescript-eslint/naming-convention */
};

export const createNofanDir = async () => {
	try {
		await fs.mkdir(`${homedir}${configPath}`);
	} catch {}
};

export const createJsonFile = async (filename: string, content: any) => {
	const filePath = `${homedir}${configPath}${filename}.json`;
	await fs.writeFile(filePath, JSON.stringify(content, null, 2), 'utf8');
};

// @ts-expect-error: Accept any JSON file
export const readJsonFile = async (filename: string): any => {
	const filePath = `${homedir}${configPath}${filename}.json`;
	const file = await fs.readFile(filePath, 'utf8');
	return JSON.parse(file);
};

export const getConfig = async (): Promise<Config> => {
	try {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return readJsonFile('config');
	} catch {
		return defaultConfig;
	}
};

export const getAccount = async (): Promise<AccountDict> => {
	try {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return readJsonFile('account');
	} catch {
		return {};
	}
};

export const setConfig = async (config: Config) =>
	createJsonFile('config', config);

export const setAccount = async (account: AccountDict) =>
	createJsonFile('account', account);

export const getTemporaryImagePathWindows = async () => {
	const temporaryPath = homedir + configPath + 'temp';
	const filepath = path.join(temporaryPath, 'temp.png');

	try {
		await fs.mkdir(temporaryPath);
	} catch {}

	const ps = new Shell({
		executionPolicy: 'Bypass',
		noProfile: true,
	});

	void ps.addCommand('$img = Get-Clipboard -Format Image');
	void ps.addCommand(`$img.save("${filepath}")`);

	try {
		await ps.invoke();
	} catch (error: any) {
		if (
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			error?.message.match(
				'You cannot call a method on a null-valued expression.',
			)
		) {
			spinner.fail('No image data found on the clipboard');
			process.exit(1);
		} else {
			console.log(error?.message);
			process.exit(1);
		}
	} finally {
		void ps.dispose();
	}

	return filepath;
};

export const getTemporaryImagePathMacos = async () => {
	const temporaryPath = homedir + configPath + 'temp';
	const filepath = path.join(temporaryPath, 'temp.png');

	try {
		await fs.mkdir(temporaryPath);
	} catch {}

	try {
		await execa('pngpaste', [filepath]);
	} catch (error) {
		if (error instanceof ExecaError) {
			if (error.code === 'ENOENT') {
				const tip = `Please use ${chalkPipe('green')(
					'`brew install pngpaste`',
				)} to solve`;
				spinner.fail(`Required ${chalkPipe('green')('`pngpaste`')}\n\n${tip}`);
				process.exit(1);
			}

			// @ts-expect-error: ExecaError has stderr property
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
			spinner.fail(error.stderr.trim());
		}

		process.exit(1);
	}

	return filepath;
};
