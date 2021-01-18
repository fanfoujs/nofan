export const switchPrompt = choices => {
	return [
		{
			type: 'list',
			name: 'username',
			message: 'Switch account to',
			choices,
			pageSize: 20
		}
	];
};
