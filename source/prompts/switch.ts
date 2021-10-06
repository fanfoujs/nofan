/* c8 ignore start */
export const switchPrompt = (
	choices: Array<
		| string
		| {
				name: string;
				disabled: string;
		  }
	>,
) => [
	{
		type: 'list',
		name: 'username',
		message: 'Switch account to',
		choices,
		pageSize: 20,
	},
];
/* c8 ignore stop */
