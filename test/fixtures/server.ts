import experss from 'express';
import {baseStatus, baseUser} from './mocks.js';

const server = () => {
	const app = experss();

	app.post('/oauth/access_token', (_request, response) => {
		response.send('oauth_token=xauthToken&oauth_token_secret=xauthTokenSecret');
	});

	app.get(
		/^\/(statuses|search)\/(home|public|mentions|user|context)(_timeline)?\.json$/,
		(_request, response) => {
			response.send([baseStatus]);
		},
	);

	app.get('/statuses/show.json', (_request, response) => {
		response.send(baseStatus);
	});

	app.get('/users/show.json', (_request, response) => {
		response.send(baseUser);
	});

	app.post(/^\/statuses\/(update|destroy)\.json$/, (_request, response) => {
		response.send(baseStatus);
	});

	app.post('/photos/upload.json', (_request, response) => {
		response.send(baseStatus);
	});

	return app;
};

export default server;
