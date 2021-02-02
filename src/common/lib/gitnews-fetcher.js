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

const fetcher = store => next => action => {
	if (action.type === 'CHANGE_TOKEN') {
		performFetch({ ...store.getState(), token: action.token }, next);
		return next(action);
	}

	if (action.type === 'GITNEWS_FETCH_NOTIFICATIONS') {
		performFetch(store.getState(), next);
	}

	return next(action);
};

function performFetch(
	{ fetchingInProgress, token, fetchingStartedAt, lastSuccessfulCheck },
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

	// Fetch twice: once for unread notifications and once for read and unread
	// notifications (it would be better to do the second fetch for just read,
	// but that's not currently possible with the API). Because of pagination,
	// it's possible that fetching read and unread notifications might miss some
	// unread ones, which the unread fetch should have a better chance of
	// finding.
	const getUnreadGithubNotifications = getFetcher(
		token,
		isDemoMode,
		'unread',
		lastSuccessfulCheck
	);
	const getReadGithubNotifications = getFetcher(
		token,
		isDemoMode,
		'read',
		lastSuccessfulCheck
	);
	try {
		const unreadGetter = getUnreadGithubNotifications().then(notes => {
			debug('unread notifications retrieved', notes);
			next(gotNotes(notes));
		});

		const readGetter = getReadGithubNotifications().then(notes => {
			debug('read notifications retrieved', notes);
			next(gotNotes(notes));
		});

		Promise.all([unreadGetter, readGetter]).then(() => {
			debug('all notifications retrieval complete');
			next(fetchDone());
		});
	} catch (err) {
		debug('fetching notifications threw an error', err);
		next(fetchDone());
		getErrorHandler(next)(err);
	}
}

function getFetcher(token, isDemoMode, readOrUnread, lastSuccessfulCheck) {
	if (isDemoMode) {
		return () => getDemoNotifications();
	}
	return () =>
		getNotifications(token, {
			per_page: 100,
			page: 1,
			since: new Date(lastSuccessfulCheck).toISOString(),
			all: readOrUnread === 'read', // ideally 'read' would fetch only read, but that's not possible right now
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
			title:
				'Teapot is Broken with error ThisIsNotATeapotPleaseTryToMakeSureYouOnlyUseATeapot',
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
