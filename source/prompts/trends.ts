import inquirer from 'inquirer';
import {Trend} from 'fanfou-sdk/dist/api';

export const trendsPrompt = (hotTrends: Trend[], savedTrends: Trend[]) => {
	const hotList = hotTrends.map((item) => item.query);
	const savedList = savedTrends.map((item) => item.query);
	if (hotList.length > 0) {
		// @ts-expect-error: To be fixed
		hotList.unshift(new inquirer.Separator('- Hot Trends -'));
	}

	if (savedList.length > 0) {
		// @ts-expect-error: To be fixed
		savedList.unshift(new inquirer.Separator('- Saved Trends -'));
	}

	return [
		{
			type: 'list',
			name: 'trends',
			message: 'Select trends',
			choices: [...hotList, ...savedList],
			pageSize: 20,
		},
	];
};
