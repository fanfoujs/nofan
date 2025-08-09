import process from 'node:process';
import ora, {type Ora} from 'ora';

// @ts-expect-error: Ignroe global spinner
let {spinner}: {spinner: Ora} = process;

export const start = (text: string) => {
	if (spinner) {
		spinner.start(text);
	} else {
		spinner = ora(text).start();
	}
};

export const info = (text: string) => {
	if (spinner) {
		spinner.info(text);
	} else {
		spinner = ora().info(text);
	}
};

export const succeed = (text?: string) => {
	if (spinner) {
		spinner.succeed(text);
	} else {
		ora().succeed(text);
	}
};

export const fail = (text?: string) => {
	if (spinner) {
		spinner.fail(text);
	} else {
		spinner = ora().fail(text);
	}
};

export const stop = () => {
	if (spinner) {
		spinner.stop();
	} else {
		spinner = ora().stop();
	}
};
