import process from 'node:process';
import ora, {Ora} from 'ora';

// @ts-expect-error: Ignroe global spinner
let {spinner}: {spinner: Ora} = process;

export const start = (text: string) => {
	spinner ||= ora(text).start();
};

export const info = (text: string) => {
	spinner ||= ora().info(text);
};

export const succeed = (text?: string) => {
	if (spinner) {
		spinner.succeed(text);
	} else {
		ora().succeed(text);
	}
};

export const fail = (text?: string) => {
	spinner.fail(text);
};

export const stop = () => {
	spinner.stop();
};
