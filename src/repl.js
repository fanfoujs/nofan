import repl from 'node:repl';

export const showInRepl = (parameters = {}) => {
	const r = repl.start({prompt: '> ', experimentalReplAwait: true});
	r.context.result = parameters;
};
