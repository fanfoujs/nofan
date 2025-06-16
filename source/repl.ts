import repl from 'node:repl';

export const showInRepl = (parameters: any = {}) => {
	const r = repl.start({prompt: '> '});
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	r.context['result'] = parameters;
};
