'use strict';

const Streamer = require('fanfou-streamer');
const notifier = require('node-notifier');
const Fanfou = require('fanfou-sdk');
const util = require('./util');

const run = async () => {
	const config = await util.getConfig();
	const account = await util.getAccount();

	const {
		CONSUMER_KEY: consumerKey,
		CONSUMER_SECRET: consumerSecret,
		OAUTH_TOKEN: oauthToken,
		OAUTH_TOKEN_SECRET: oauthTokenSecret
	} = account[config.USER];

	const options = {
		consumerKey,
		consumerSecret,
		oauthToken,
		oauthTokenSecret,
		protocol: config.SSL ? 'https:' : 'http:',
		hooks: {
			baseString: str => config.SSL ? str.replace('https', 'http') : str
		}
	};

	const streamer = new Streamer(options);
	const ff = new Fanfou(options);

	const replyBox = (message, res) => {
		notifier.notify({
			title: 'Nofan',
			message,
			reply: `Reply to @${res.source.screen_name}`
		}, (error, response, metadata) => {
			if (!error && metadata && metadata.activationType === 'replied') {
				ff.post('/statuses/update', {
					in_reply_to_status_id: res.object.id,
					status: `@${res.source.screen_name} ${metadata.activationValue}`
				}, () => {});
			}
		});
	};

	const messageBox = message => {
		notifier.notify({
			title: 'Nofan',
			message
		});
	};

	// Mentions
	streamer.on('message.mention', res => {
		replyBox(`@${res.source.screen_name} mentioned you\n${res.object.text}`, res);
	});

	// Reply
	streamer.on('message.reply', res => {
		replyBox(`@${res.source.screen_name} replied to you\n${res.object.text}`, res);
	});

	// Repost
	streamer.on('message.repost', res => {
		replyBox(`@${res.source.screen_name} reposted\n${res.object.text}`, res);
	});

	// Add fav
	streamer.on('fav.create', res => {
		replyBox(`@${res.source.screen_name} faved\n${res.object.text}`, res);
	});

	// Del fav
	streamer.on('fav.delete', res => {
		replyBox(`@${res.source.screen_name} unfaved\n${res.object.text}`, res);
	});

	// Create direct message
	streamer.on('dm.create', res => {
		messageBox(`@${res.source.screen_name} messaging to you\n${res.object.text}`, res);
	});

	// Create friend
	streamer.on('friends.create', res => {
		messageBox(`@${res.source.screen_name} is following you`);
	});

	// Request friend
	streamer.on('friends.request', res => {
		messageBox(`@${res.source.screen_name} requesting to follow you`);
	});

	streamer.start();
};

run();
