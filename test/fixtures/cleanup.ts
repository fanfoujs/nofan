import del from 'del';
import * as util from '../../source/util.js';

const cleanup = async () => {
	await del([util.homedir + util.configPath], {force: true});
};

export default cleanup;
