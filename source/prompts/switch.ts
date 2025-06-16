import {search} from '@inquirer/prompts';

export const switchPrompt = async (
	choices: Array<{
		value: string;
		disabled: string | boolean;
	}>,
) => {
	return search({
		message: 'Switch account to',
		async source(term) {
			if (!term) return choices;
			return choices.filter((x) =>
				x.value.toLowerCase().includes(term.toLowerCase()),
			);
		},
		pageSize: 20,
	});
};
