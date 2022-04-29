import http, {Server} from 'node:http';
import anyTest, {TestFn} from 'ava';
import {execa} from 'execa';
import listen from 'test-listen';
import * as util from '../source/util.js';
import app from './fixtures/server.js';
import cleanup from './fixtures/cleanup.js';

const cli = (...parameters: string[]) =>
	execa('node', [
		'--no-warnings',
		'--loader',
		'ts-node/esm',
		'./source/cli.ts',
		...parameters,
	]);

const test = anyTest as TestFn<{
	server: Server;
}>;

test.before(async (t) => {
	await cleanup();

	const server = http.createServer(app());
	const prefixUrl = await listen(server);
	const domain = prefixUrl.replace('http://', '');

	t.deepEqual(util.getConfig(), util.defaultConfig);

	util.createNofanDir();
	util.setConfig({
		...util.defaultConfig,
		/* eslint-disable @typescript-eslint/naming-convention */
		CONSUMER_KEY: 'consumerKey',
		CONSUMER_SECRET: 'consumerSecret',
		API_DOMAIN: domain,
		OAUTH_DOMAIN: domain,
		SSL: false,
		/* eslint-enable @typescript-eslint/naming-convention */
	});

	t.context.server = server;
});

test.after.always(async (t) => {
	await cleanup();

	t.context.server.close();
});

test.serial('login', async (t) => {
	const {stderr} = await cli('login', 'user1', 'password1');
	t.true(stderr.endsWith('Login succeed!'));

	const config = util.getConfig();
	const account = util.getAccount();
	t.is(config.USER, 'user1');
	t.truthy(account['user1']);
});

test.serial('login another account', async (t) => {
	const {stderr} = await cli('login', 'user2', 'password2');
	t.true(stderr.endsWith('Login succeed!'));

	const config = util.getConfig();
	const account = util.getAccount();
	t.is(config.USER, 'user2');
	t.truthy(account['user2']);
});

test.serial('switch account', async (t) => {
	const {stderr} = await cli('switch', 'user1');
	t.true(stderr.endsWith('Switch account to user1'));
});

test.serial('logout', async (t) => {
	const {stderr} = await cli('logout');
	t.true(stderr.endsWith('Logout succeed!'));

	const config = util.getConfig();
	const account = util.getAccount();
	t.is(config.USER, 'user2');
	t.falsy(account['user1']);
	t.truthy(account['user2']);
});

test('fetch default (home-timeline)', async (t) => {
	const {stdout} = await cli();
	t.true(stdout.startsWith('[userName] Base status text.'));
});

test('fetch home-timeline', async (t) => {
	const {stdout} = await cli('home');
	t.true(stdout.startsWith('[userName] Base status text.'));
});

test('fetch mentions-timeline', async (t) => {
	const {stdout} = await cli('mentions');
	t.true(stdout.startsWith('[userName] Base status text.'));
});

test('fetch self-timeline', async (t) => {
	const {stdout} = await cli('me');
	t.true(stdout.startsWith('[userName] Base status text.'));
});

test('fetch public-timeline', async (t) => {
	const {stdout} = await cli('public');
	t.true(stdout.startsWith('[userName] Base status text.'));
});

test('fetch context-timeline', async (t) => {
	const {stdout} = await cli('context');
	t.true(stdout.startsWith('[userName] Base status text.'));
});

test('search statuses', async (t) => {
	const {stdout} = await cli('search', 'foo', 'bar');
	t.true(stdout.startsWith('[userName] Base status text.'));
});

test('fetch user-timeline', async (t) => {
	const {stdout} = await cli('user', 'user1');
	t.true(stdout.startsWith('[userName] Base status text.'));
});

test('post status', async (t) => {
	const {stderr} = await cli('hi', 'there');
	t.true(stderr.endsWith('Sent!'));
});

test('delete previous status', async (t) => {
	const {stderr} = await cli('undo');
	t.true(stderr.endsWith('Deleted!'));
});

test('reply', async (t) => {
	const {stderr} = await cli('reply', 'statusesId', 'greetings');
	t.true(stderr.endsWith('Sent!'));
});

test('repost', async (t) => {
	const {stderr} = await cli('repost', 'statusesId', 'greetings');
	t.true(stderr.endsWith('Sent!'));
});

test('show status', async (t) => {
	const {stdout} = await cli('show', 'statusesId');
	t.true(stdout.startsWith('[userName] Base status text.'));
});

test('get api', async (t) => {
	const {stdout} = await cli('get', 'statuses/public_timeline');
	t.true(stdout.includes('baseStatusId'));
});

test('post api', async (t) => {
	const {stdout} = await cli('post', 'statuses/update', '--statuses=hi');
	t.true(stdout.includes('baseStatusId'));
});

test('get/post without uri', async (t) => {
	const getError = await t.throwsAsync(async () => {
		await cli('get');
	});
	t.true(getError?.message.endsWith('Please specify the URI'));

	const postError = await t.throwsAsync(async () => {
		await cli('post');
	});
	t.true(postError?.message.endsWith('Please specify the URI'));
});

test('post photo with invalid path', async (t) => {
	const error = await t.throwsAsync(async () => {
		await cli('hi', 'there', '-p', 'FILE_DOES_NOT_EXIST');
	});
	t.true(
		error?.message.endsWith(
			`ENOENT: no such file or directory, stat 'FILE_DOES_NOT_EXIST'`,
		),
	);
});
