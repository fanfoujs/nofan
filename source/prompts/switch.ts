import {select} from '@inquirer/prompts';

export const switchPrompt = async (
	choices: Array<{
		value: string;
		disabled: string | boolean;
	}>,
) => {
	return select({
		message: 'Switch account to',
		choices,
		pageSize: 20,
	});
};
