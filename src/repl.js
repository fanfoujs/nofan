'use strict';

const repl = require('repl');

const showInRepl = (params = {}) => {
	const r = repl.start('> ');
	r.context.result = params;
};

module.exports = {
	showInRepl
};
