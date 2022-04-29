import test from 'ava';
import Nofan from '../source/nofan.js';

test('default', (t) => {
	const nofan = new Nofan();

	t.is(nofan.verbose, undefined);
	t.is(nofan.photo, undefined);
	t.is(nofan.clipboard, undefined);
	t.is(nofan.repl, undefined);
	t.is(nofan.consoleType, 'log');
	t.deepEqual(nofan.params, {});
});
