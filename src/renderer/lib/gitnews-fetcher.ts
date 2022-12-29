import debugFactory from 'debug';
import { Middleware, Dispatch } from 'redux';
import {
	secsToMs,
	isOfflineCode,
	getErrorMessage,
	isGitHubOffline,
	isInvalidJson,
} from '../lib/helpers';
import { createNoteGetter } from 'gitnews';
import {
	changeToOffline,
	fetchBegin,
	fetchDone,
	gotNotes,
	addConnectionError,
} from '../lib/reducer';
import {
	AppReduxAction,
	AppReduxState,
	Note,
	UnknownFetchError,
} from '../types';

const debug = debugFactory('gitnews-menubar');

export function createFetcher(): Middleware<object, AppReduxState> {
	const fetcher: Middleware<object, AppReduxState> =
		(store) => (next) => (action: AppReduxAction) => {
			if (action.type === 'CHANGE_TOKEN') {
				debug('Token being changed; fetching with new token');
				window.electronApi.logMessage(
					'Token being changed; fetching with new token',
					'info'
				);
				performFetch(
					Object.assign({}, store.getState(), { token: action.token }),
					next
				);
				return next(action);
			}

			if (action.type !== 'GITNEWS_FETCH_NOTIFICATIONS') {
				return next(action);
			}

			debug('fetching with existing token');
			window.electronApi.logMessage('Fetching with existing token', 'info');
			performFetch(store.getState(), next);
			return;
		};

	async function performFetch(
		{ fetchingInProgress, token, fetchingStartedAt, isDemoMode }: AppReduxState,
		next: Dispatch<AppReduxAction>
	) {
		const fetchingMaxTime = secsToMs(120); // 2 minutes
		if (fetchingInProgress) {
			const timeSinceFetchingStarted = Date.now() - (fetchingStartedAt || 0);
			if (timeSinceFetchingStarted > fetchingMaxTime) {
				const message = `It has been too long since we started fetching (${timeSinceFetchingStarted} ms). Giving up.`;
				debug(message);
				window.electronApi.logMessage(message, 'info');
				next(fetchDone());
				return;
			}
			debug('skipping notifications check because we are already fetching');
			return;
		}
		if (!window.navigator.onLine) {
			debug('skipping notifications check because we are offline');
			window.electronApi.logMessage(
				'Skipping notifications check because we are offline',
				'info'
			);
			next(changeToOffline());
			return;
		}
		if (!token) {
			next(changeToOffline());
			return;
		}
		debug('fetching notifications in middleware');
		// NOTE: After this point, any return action MUST disable fetchingInProgress
		// or the app will get stuck never updating again.
		next(fetchBegin());
		const getGithubNotifications = getFetcher(token, isDemoMode);
		try {
			const notes = await getGithubNotifications();
			debug('notifications retrieved', notes);
			window.electronApi.logMessage(
				`Notifications retrieved (${notes.length} found)`,
				'info'
			);
			next(fetchDone());
			next(gotNotes(notes));
		} catch (err) {
			debug('fetching notifications threw an error', err);
			window.electronApi.logMessage(
				`Fetching notifications threw an error`,
				'warn'
			);
			next(fetchDone());
			getErrorHandler(next)(err as Error, token);
		}
	}

	const getNotifications = createNoteGetter({
		fetch: (url, options) => fetch(url, options),
		log: (message) => {
			console.log('Gitnews: ' + message);
		},
	});

	function getFetcher(
		token: string,
		isDemoMode: boolean
	): () => Promise<Note[]> {
		if (isDemoMode) {
			return () => getDemoNotifications();
		}
		return () => getNotifications(token);
	}

	return fetcher;
}

async function getDemoNotifications(): Promise<Note[]> {
	return [
		{
			updatedAt: new Date('21 December 2019 14:48 UTC').getTime(),
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
			updatedAt: new Date('20 December 2019 14:52 UTC').getTime(),
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
			updatedAt: new Date('20 December 2019 10:52 UTC').getTime(),
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
			updatedAt: new Date('20 November 2019 16:20 UTC').getTime(),
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

export function getErrorHandler(dispatch: Dispatch<AppReduxAction>) {
	return function handleFetchError(
		err: UnknownFetchError,
		token: string | undefined = undefined
	) {
		if (
			typeof err === 'object' &&
			err.code === 'GitHubTokenNotFound' &&
			!token
		) {
			const message =
				'Notifications check failed because there is no token; taking no action';
			debug(message);
			window.electronApi.logMessage(message, 'info');
			// Do nothing. The case of having no token is handled in the App component.
			return;
		}

		if (
			typeof err === 'object' &&
			err.code === 'GitHubTokenNotFound' &&
			token
		) {
			// This should never happen, I hope!
			const message =
				'Notifications check failed because there is no token, even though one is set';
			debug(message);
			window.electronApi.logMessage(message, 'error');
			const errorString =
				'Error fetching notifications: ' + getErrorMessage(err);
			console.error(errorString); //eslint-disable-line no-console
			dispatch(addConnectionError(errorString));
			return;
		}

		if (typeof err === 'object' && isOfflineCode(err.code ?? '')) {
			// This is normal. We'll just wait.
			const message = 'Notifications check failed because we are offline';
			debug(message);
			window.electronApi.logMessage(message, 'warn');
			dispatch(changeToOffline());
			return;
		}

		if (isGitHubOffline(err)) {
			// This is normal. We'll just wait.
			const message = 'Notifications check failed because GitHub is offline';
			debug(message);
			window.electronApi.logMessage(message, 'warn');
			dispatch(changeToOffline());
			return;
		}

		if (isInvalidJson(err)) {
			// This is less normal but still not too bad. We'll just wait.
			const message = 'Notifications check failed because json fetch failed';
			debug(message);
			window.electronApi.logMessage(message, 'warn');
			dispatch(changeToOffline());
			return;
		}

		if (
			typeof err === 'object' &&
			err.name === 'TypeError' &&
			err.message === 'Failed to fetch'
		) {
			// This is less normal but still not too bad. We'll just wait.
			const message = `Notifications check failed with a fetching error: ${err}`;
			debug(message);
			window.electronApi.logMessage(message, 'warn');
			dispatch(changeToOffline());
			return;
		}

		// If we get here, something really unknown has happened. Let's really try
		// to avoid getting here.
		const message = `Notifications check failed but we do not know why. Error: ${err}`;
		debug(message);
		window.electronApi.logMessage(message, 'error');
		const errorString = 'Error fetching notifications: ' + getErrorMessage(err);
		console.error(errorString); //eslint-disable-line no-console
		dispatch(addConnectionError(errorString));
	};
}
