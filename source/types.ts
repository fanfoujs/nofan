export type Account = {
	CONSUMER_KEY?: string;
	CONSUMER_SECRET?: string;
	OAUTH_TOKEN?: string;
	OAUTH_TOKEN_SECRET?: string;
};

export type AccountDict = Record<string, Account>;

export type Config = {
	USER?: string;
	CONSUMER_KEY?: string;
	CONSUMER_SECRET?: string;
	DISPLAY_COUNT?: number;
	TIME_TAG?: boolean;
	PHOTO_TAG?: boolean;
	SSL?: boolean;
	API_DOMAIN?: string;
	OAUTH_DOMAIN?: string;
	VERBOSE?: boolean;
	COLORS?: {
		name: string;
		text: string;
		at: string;
		link: string;
		tag: string;
		photo: string;
		timeago: string;
		highlight: string;
	};
};

export type Settings = {
	display_count: string;
	display: string[];
	key: string;
	secret: string;
	api_domain: string;
	oauth_domain: string;
};

export type ConsoleType =
	| 'log'
	| 'warn'
	| 'dir'
	| 'time'
	| 'timeEnd'
	| 'timeLog'
	| 'trace'
	| 'assert'
	| 'clear'
	| 'count'
	| 'countReset'
	| 'group'
	| 'groupEnd'
	| 'table'
	| 'debug'
	| 'info'
	| 'dirxml'
	| 'error'
	| 'groupCollapsed'
	| 'Console'
	| 'profile'
	| 'profileEnd'
	| 'timeStamp'
	| 'context';
