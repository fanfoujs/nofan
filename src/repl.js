'use strict';

const repl = require('repl');

const showInRepl = (parameters = {}) => {
	const r = repl.start('> ');
	r.context.result = parameters;
};

module.exports = {
	showInRepl
};
