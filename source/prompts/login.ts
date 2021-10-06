/* c8 ignore start */
export const loginPrompt = (opt: {hasName: boolean}) => {
	const usernameInput = {
		type: 'input',
		name: 'username',
		message: 'Enter your username',
	};
	const passwordInput = {
		type: 'password',
		name: 'password',
		message: 'Enter your password',
		mask: '*',
	};
	if (opt.hasName) {
		return [passwordInput];
	}

	return [usernameInput, passwordInput];
};
/* c8 ignore stop */
