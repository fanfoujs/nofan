import {input} from '@inquirer/prompts';
import chalkPipe from 'chalk-pipe';
import {type Config} from '../types.js';

const transformer = (text: string) => chalkPipe(text)(text);

export const colorsPrompt = async (config: Config) => {
	const text = await input({
		message: 'Text color',
		default: config.COLORS?.text ?? '',
		transformer,
	});

	const name = await input({
		message: 'Name color',
		default: config.COLORS?.name ?? 'green',
		transformer,
	});

	const at = await input({
		message: 'ATs color',
		default: config.COLORS?.at ?? 'blue',
		transformer,
	});

	const link = await input({
		message: 'Link color',
		default: config.COLORS?.link ?? 'blue',
		transformer,
	});

	const tag = await input({
		message: 'Tag color',
		default: config.COLORS?.tag ?? 'blue',
		transformer,
	});

	const photo = await input({
		message: 'Photo color',
		default: config.COLORS?.photo ?? 'blue',
		transformer,
	});

	const timeago = await input({
		message: 'Timeago color',
		default: config.COLORS?.timeago ?? 'green',
		transformer,
	});

	const highlight = await input({
		message: 'Highlight color',
		default: config.COLORS?.highlight ?? 'bold',
		transformer,
	});

	return {
		text,
		name,
		at,
		link,
		tag,
		photo,
		timeago,
		highlight,
	};
};
