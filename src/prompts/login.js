'use strict';

module.exports = opt => {
	const usernameInput = {
		type: 'input',
		name: 'username',
		message: 'Enter your usename'
	};
	const passwordInput = {
		type: 'password',
		name: 'password',
		message: 'Enter your password',
		mask: '*'
	};
	if (opt.hasName) {
		return [passwordInput];
	}
	return [usernameInput, passwordInput];
};
