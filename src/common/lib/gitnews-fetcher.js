/* globals window */
require('dotenv').config();

const debugFactory = require('debug');
const {
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
const isDemoMode = process.env.GITNEWS_DEMO_MODE ? true : false;
if (isDemoMode) {
	debug('demo mode enabled!');
}

const maxIntervalForPollingReadNotifications = 20 * 60 * 60 * 1000; // 20 minutes

const fetcher = store => next => action => {
	if (action.type === 'CHANGE_TOKEN') {
		performFetch({ ...store.getState(), token: action.token }, next);
		return next(action);
	}

	if (action.type !== 'GITNEWS_FETCH_NOTIFICATIONS') {
		return next(action);
	}

	performFetch(store.getState(), next);
};

function performFetch(
	{
		fetchingInProgress,
		token,
		fetchingStartedAt,
		notes,
		lastSuccessfulReadCheck,
	},
	next
) {
	const fetchingMaxTime = secsToMs(120); // 2 minutes
	if (fetchingInProgress) {
		const timeSinceFetchingStarted = Date.now() - (fetchingStartedAt || 0);
		if (timeSinceFetchingStarted > fetchingMaxTime) {
			debug(
				`it has been too long since we started fetching (${timeSinceFetchingStarted} ms). Giving up.`
			);
			next(fetchDone());
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
	// Only fetch read notifications if we have none or if it's been a while since
	// we last fetched them
	const shouldFetchRead =
		notes.length === 0 ||
		new Date() - new Date(lastSuccessfulReadCheck) >
			maxIntervalForPollingReadNotifications;
	debug('should we fetch read notifications?', shouldFetchRead);
	const getGithubNotifications = getFetcher(token, isDemoMode, shouldFetchRead);
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
	}
}

function getFetcher(token, isDemoMode, shouldFetchRead) {
	if (isDemoMode) {
		return () => getDemoNotifications();
	}
	return () =>
		getNotifications(token, {
			per_page: 100,
			page: 1,
			all: shouldFetchRead,
		});
}

async function getDemoNotifications() {
	return [
		{
			updatedAt: new Date('21 December 2019 14:48 UTC').toISOString(),
			unread: true,
			repositoryName: 'gitnews-menubar',
			repositoryFullName: 'sirbrillig/gitnews-menubar',
			title: 'Brew Tea Properly',
			type: 'PullRequest',
			id: '5682942812944a3d2c3e6230b0190f26',
			repositoryOwnerAvatar:
				'https://avatars1.githubusercontent.com/u/887802?v=4',
			subjectUrl: 'https://github.com/sirbrillig/gitnews-menubar/pull/65',
			commentUrl: 'https://github.com/sirbrillig/gitnews-menubar/pull/65',
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
			repositoryName: 'gitnews-menubar',
			repositoryFullName: 'sirbrillig/gitnews-menubar',
			title: 'Fix Teapot',
			type: 'PullRequest',
			id: '1234566b0a944a3d2c3e6230b0190f26',
			repositoryOwnerAvatar:
				'https://avatars1.githubusercontent.com/u/887802?v=4',
			subjectUrl: 'https://github.com/sirbrillig/gitnews-menubar/pull/44',
			commentUrl: 'https://github.com/sirbrillig/gitnews-menubar/pull/44',
			commentAvatar: 'https://avatars2.githubusercontent.com/u/2036909?v=4',
			api: {
				subject: {
					state: 'closed',
					merged: true,
				},
			},
		},
		{
			updatedAt: new Date('20 December 2019 10:52 UTC').toISOString(),
			unread: true,
			repositoryName: 'gitnews-menubar',
			repositoryFullName: 'sirbrillig/gitnews-menubar',
			title: 'Teapot is Broken with error ThisIsNotATeapotPleaseTryToMakeSureYouOnlyUseATeapot',
			type: 'Issue',
			id: '2967500023477777222e6230b0190f26',
			repositoryOwnerAvatar:
				'https://avatars1.githubusercontent.com/u/887802?v=4',
			subjectUrl: 'https://github.com/sirbrillig/gitnews-menubar/pull/48',
			commentUrl: 'https://github.com/sirbrillig/gitnews-menubar/pull/48',
			commentAvatar: 'https://avatars2.githubusercontent.com/u/2036909?v=4',
			api: {
				subject: {
					state: 'open',
					merged: false,
				},
			},
		},
		{
			updatedAt: new Date('20 November 2019 16:20 UTC').toISOString(),
			unread: true,
			repositoryName: 'gitnews-menubar',
			repositoryFullName: 'sirbrillig/gitnews-menubar',
			title: 'Tea is bitter',
			type: 'Issue',
			id: '4582894865123099522e6230b0190f26',
			repositoryOwnerAvatar:
				'https://avatars1.githubusercontent.com/u/887802?v=4',
			subjectUrl: 'https://github.com/sirbrillig/gitnews-menubar/pull/35',
			commentUrl: 'https://github.com/sirbrillig/gitnews-menubar/pull/35',
			commentAvatar: 'https://avatars2.githubusercontent.com/u/2036909?v=4',
			api: {
				subject: {
					state: 'closed',
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
	};
}

module.exports = {
	fetcher,
	getErrorHandler,
};
