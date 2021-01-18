import repl from 'repl';

export const showInRepl = (parameters = {}) => {
	const r = repl.start('> ');
	r.context.result = parameters;
};
