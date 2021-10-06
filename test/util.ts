import {constants} from 'node:fs';
import {access} from 'node:fs/promises';
import test from 'ava';
import del from 'del';
import * as util from '../source/util.js';

const nofanConfigPath = util.homedir + util.configPath;

const cleanup = async () => {
	await del([nofanConfigPath], {force: true});
};

test.before(async () => {
	await cleanup();
});

test.after.always(async () => {
	await cleanup();
});

test.serial('config path should not use production path', (t) => {
	t.not(util.configPath, '/.nofan/');
});

test.serial('check configuration directory', async (t) => {
	const error = await t.throwsAsync(
		async () => {
			await access(nofanConfigPath, constants.R_OK);
		},
		{instanceOf: Error},
	);
	t.true(error.message.startsWith('ENOENT: no such file or directory, access'));
});

test.serial('createNofanDir', async (t) => {
	util.createNofanDir();
	await t.notThrowsAsync(async () => {
		await access(
			nofanConfigPath,
			// eslint-disable-next-line no-bitwise
			constants.R_OK | constants.W_OK,
		);
	});
});

test.serial('no matter if created twice', (t) => {
	util.createNofanDir();
	t.pass();
});

test.serial('initialize with defaultConfig', (t) => {
	const config = util.getConfig();
	t.deepEqual(config, util.defaultConfig);
});

test.serial('initialize with empty account', (t) => {
	const account = util.getAccount();
	t.deepEqual(account, {});
});

test.serial('save user info to configs', (t) => {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	util.setConfig({...util.defaultConfig, USER: 'testuser'});
	t.is(util.getConfig().USER, 'testuser');

	const account = {
		testuser: {
			/* eslint-disable @typescript-eslint/naming-convention */
			CONSUMER_KEY: '',
			CONSUMER_SECRET: '',
			OAUTH_TOKEN: '',
			OAUTH_TOKEN_SECRET: '',
			/* eslint-enable @typescript-eslint/naming-convention */
		},
	};
	util.setAccount(account);
	t.deepEqual(util.getAccount(), account);
});
