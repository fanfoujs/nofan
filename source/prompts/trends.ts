import {Separator, select} from '@inquirer/prompts';
import {type Trend} from 'fanfou-sdk';

type TrendChoice = string | Separator;

export const trendsPrompt = async (
	hotTrends: Trend[],
	savedTrends: Trend[],
) => {
	const hotList: TrendChoice[] = hotTrends.map((item) => item.query);
	const savedList: TrendChoice[] = savedTrends.map((item) => item.query);

	if (hotList.length > 0) {
		hotList.unshift(new Separator('- Hot Trends -'));
	}

	if (savedList.length > 0) {
		savedList.unshift(new Separator('- Saved Trends -'));
	}

	const choices = [...hotList, ...savedList];

	return select<string>({
		message: 'Select trends',
		choices,
	});
};
