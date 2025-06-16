import {input, password as pwd} from '@inquirer/prompts';

export const loginPrompt = async (options?: {currentUsername?: string}) => {
	const username =
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		options?.currentUsername ||
		(await input({
			message: 'Enter your username',
		}));

	const password = await pwd({
		message: 'Enter your password',
		mask: '*',
	});

	return {username, password};
};
