/* globals window */
require('dotenv').config();

const debugFactory = require('debug');
const {
	logError,
	secsToMs,
	isOfflineCode,
	getErrorMessage,
	isGitHubOffline,
	isInvalidJson,
} = require('common/lib/helpers');
const { getNotifications } = require('gitnews');
const {
	changeToOffline,
	fetchBegin,
	fetchDone,
	gotNotes,
	addConnectionError,
} = require('common/lib/reducer');

const debug = debugFactory('gitnews-menubar');

const fetcher = store => next => action => {
	// eslint-disable-line no-unused-vars
	if (action.type === 'CHANGE_TOKEN') {
		performFetch(
			Object.assign({}, store.getState(), { token: action.token }),
			next
		);
		return next(action);
	}

	if (action.type !== 'GITNEWS_FETCH_NOTIFICATIONS') {
		return next(action);
	}

	performFetch(store.getState(), next);
};

function performFetch({ fetchingInProgress, token, fetchingStartedAt }, next) {
	let isDemoMode = false;
	if (process.env.GITNEWS_DEMO_MODE) {
		debug('demo mode enabled!');
		isDemoMode = true;
	}
	const fetchingMaxTime = secsToMs(120); // 2 minutes
	if (fetchingInProgress) {
		const timeSinceFetchingStarted = Date.now() - (fetchingStartedAt || 0);
		if (timeSinceFetchingStarted > fetchingMaxTime) {
			debug(
				`it has been too long since we started fetching (${timeSinceFetchingStarted} ms). Giving up.`
			);
			next(fetchDone());
			logError(new Error('Fetching timed out.'));
			return;
		}
		debug('skipping notifications check because we are already fetching');
		return;
	}
	if (!window.navigator.onLine) {
		debug('skipping notifications check because we are offline');
		next(changeToOffline());
		return;
	}
	debug('fetching notifications in middleware');
	// NOTE: After this point, any return action MUST disable fetchingInProgress
	// or the app will get stuck never updating again.
	next(fetchBegin());
	const getGithubNotifications = getFetcher(token, isDemoMode);
	try {
		getGithubNotifications()
			.then(notes => {
				debug('notifications retrieved', notes);
				next(fetchDone());
				next(gotNotes(notes));
			})
			.catch(err => {
				debug('fetching notifications failed with the error', err);
				next(fetchDone());
				getErrorHandler(next)(err);
			});
	} catch (err) {
		debug('fetching notifications threw an error', err);
		next(fetchDone());
		getErrorHandler(next)(err);
		logError(err);
	}
}

function getFetcher(token, isDemoMode) {
	if (isDemoMode) {
		return () => getDemoNotifications();
	}
	return () => getNotifications(token);
}

async function getDemoNotifications() {
	return [
		{
			updatedAt: new Date('21 December 2019 14:48 UTC').toISOString(),
			unread: true,
			repositoryName: 'gitnews',
			repositoryFullName: 'sirbrillig/gitnews',
			title: 'Pieces of Eight',
			type: 'PullRequest',
			id: 'd568cb6b0a944a3d2c3e6230b0190f26',
			repositoryOwnerAvatar:
				'https://avatars1.githubusercontent.com/u/887802?v=4',
			subjectUrl: 'https://github.com/Automattic/wp-calypso/pull/38435',
			commentUrl:
				'https://github.com/Automattic/wp-calypso/pull/38435#issuecomment-568611814',
			commentAvatar: 'https://avatars2.githubusercontent.com/u/2036909?v=4',
			api: {
				subject: {
					state: 'open',
					merged: false,
				},
			},
		},
		{
			updatedAt: new Date('20 December 2019 14:52 UTC').toISOString(),
			unread: true,
			repositoryName: 'gitnews',
			repositoryFullName: 'sirbrillig/gitnews',
			title: 'Trysail Sail ho Corsair',
			type: 'PullRequest',
			id: '1234566b0a944a3d2c3e6230b0190f26',
			repositoryOwnerAvatar:
				'https://avatars1.githubusercontent.com/u/887802?v=4',
			subjectUrl: 'https://github.com/Automattic/wp-calypso/pull/38435',
			commentUrl:
				'https://github.com/Automattic/wp-calypso/pull/38435#issuecomment-568611814',
			commentAvatar: 'https://avatars2.githubusercontent.com/u/2036909?v=4',
			api: {
				subject: {
					state: 'open',
					merged: false,
				},
			},
		},
	];
}

function getErrorHandler(dispatch) {
	return function handleFetchError(err) {
		if (err.code === 'GitHubTokenNotFound') {
			debug('notifications check failed because there is no token');
			// Do nothing. The case of having no token is handled in the App component.
			return;
		}
		if (isOfflineCode(err.code)) {
			debug('notifications check failed because we are offline');
			dispatch(changeToOffline());
			return;
		}
		if (isGitHubOffline(err)) {
			debug('notifications check failed because GitHub is offline');
			dispatch(changeToOffline());
			return;
		}
		if (isInvalidJson(err)) {
			debug('notifications check failed because json fetch failed');
			dispatch(changeToOffline());
			return;
		}
		const errorString = 'Error fetching notifications: ' + getErrorMessage(err);
		console.error(errorString); //eslint-disable-line no-console
		dispatch(addConnectionError(errorString));
		logError(new Error(errorString));
	};
}

module.exports = {
	fetcher,
	getErrorHandler,
};
