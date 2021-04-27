import chalkPipe from 'chalk-pipe';

export const colorsPrompt = (config) => {
	const transformer = (text) => {
		return chalkPipe(text)(text);
	};

	return [
		{
			type: 'input',
			name: 'text',
			message: 'Text color',
			default: config.COLORS.text || '',
			transformer
		},
		{
			type: 'input',
			name: 'name',
			message: 'Name color',
			default: config.COLORS.name || 'green',
			transformer
		},
		{
			type: 'input',
			name: 'at',
			message: 'ATs color',
			default: config.COLORS.at || 'blue',
			transformer
		},
		{
			type: 'input',
			name: 'link',
			message: 'Link color',
			default: config.COLORS.link || 'blue',
			transformer
		},
		{
			type: 'input',
			name: 'tag',
			message: 'Tag color',
			default: config.COLORS.tag || 'blue',
			transformer
		},
		{
			type: 'input',
			name: 'photo',
			message: 'Photo color',
			default: config.COLORS.photo || 'blue',
			transformer
		},
		{
			type: 'input',
			name: 'timeago',
			message: 'Timeago color',
			default: config.COLORS.timeago || 'green',
			transformer
		},
		{
			type: 'input',
			name: 'highlight',
			message: 'Highlight color',
			default: config.COLORS.highlight || 'bold',
			transformer
		}
	];
};
