import {checkbox, input, number} from '@inquirer/prompts';
import {type Config, type Settings} from '../types.js';

export const configPrompt = async (config: Config): Promise<Settings> => {
	const displayCount =
		(await number({
			message: 'How many statuses would you like to display (1 - 60)',
			default: config.DISPLAY_COUNT ?? 10,
		})) ?? 10;

	const displayConfigs = await checkbox({
		message: 'Global Settings',
		choices: [
			{
				name: 'Time Tag',
				value: 'timeTag',
				checked: config.TIME_TAG,
			},
			{
				name: 'Photo Tag',
				value: 'photoTag',
				checked: config.PHOTO_TAG,
			},
			{
				name: 'Use HTTPS',
				value: 'useHttps',
				checked: config.SSL ?? false,
			},
			{
				name: 'Verbose Mode',
				value: 'verboseMode',
				checked: config.VERBOSE ?? false,
			},
		],
	});

	const consumerKey = await input({
		message: 'Enter your consumer key',
		default: config.CONSUMER_KEY,
	});

	const consumerSecret = await input({
		message: 'Enter your consumer secret',
		default: config.CONSUMER_SECRET,
	});

	const apiDomain = await input({
		message: 'Config your API domain',
		default: config.API_DOMAIN ?? 'api.fanfou.com',
	});

	const oauthDomain = await input({
		message: 'Config your OAuth domain',
		default: config.OAUTH_DOMAIN ?? 'fanfou.com',
	});

	return {
		displayCount,
		displayConfigs,
		consumerKey,
		consumerSecret,
		apiDomain,
		oauthDomain,
	};
};
