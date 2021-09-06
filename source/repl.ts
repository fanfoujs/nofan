import repl from 'node:repl';

export const showInRepl = (parameters = {}) => {
	const r = repl.start({prompt: '> '});
	r.context['result'] = parameters;
};
