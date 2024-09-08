import debugFactory from 'debug';
import { Middleware } from 'redux';
import {
	isAction,
	isDispatch,
	secsToMs,
	isOfflineCode,
	getErrorMessage,
	isGitHubOffline,
	isInvalidJson,
	isTokenInvalid,
} from '../lib/helpers';
import {
	changeToOffline,
	fetchBegin,
	fetchDone,
	gotNotes,
	addConnectionError,
	setIsTokenInvalid,
} from '../lib/reducer';
import { AccountInfo, AppReduxState, Note, UnknownFetchError } from '../types';
import { AppDispatch } from './store';
import { createDemoNotifications } from './demo-mode';
import { defaultAccountInfo } from './constants';

const debug = debugFactory('gitnews-menubar');

let currentDemoNotifications = createDemoNotifications();

export function createFetcher(): Middleware<{}, AppReduxState> {
	const fetcher: Middleware<object, AppReduxState> =
		(store) => (next) => (action) => {
			if (!isAction(action)) {
				throw new Error(
					'Invalid action dispatched in fetcher: ' + JSON.stringify(action)
				);
			}
			if (!isDispatch(next)) {
				throw new Error('Invalid dispatcher in fetcher');
			}
			if (action.type === 'MARK_NOTE_READ' && store.getState().isDemoMode) {
				currentDemoNotifications = currentDemoNotifications.map((note) => {
					if (note.id === action.note.id) {
						note.unread = false;
					}
					return note;
				});
				return next(action);
			}

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
		{
			fetchingInProgress,
			token,
			fetchingStartedAt,
			isDemoMode,
			accounts,
		}: AppReduxState,
		next: AppDispatch
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

		// FIXME: This should be a permanent migration to the account system somewhere
		const doesIncludeMainGithubAccount = accounts.some(
			(account) => account.serverUrl === defaultAccountInfo.serverUrl
		);
		if (!doesIncludeMainGithubAccount) {
			accounts = [
				...accounts,
				{
					...defaultAccountInfo,
					apiKey: token,
				},
			];
		}

		const getGithubNotifications = getFetcher(accounts, isDemoMode);
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

	function getFetcher(
		accounts: AccountInfo[],
		isDemoMode: boolean
	): () => Promise<Note[]> {
		if (isDemoMode) {
			return () => getDemoNotifications();
		}
		return async () => {
			let allNotes: Note[] = [];
			for (const account of accounts) {
				const notes = await fetchNotifications(account);
				allNotes = [...allNotes, ...notes];
			}
			return allNotes;
		};
	}

	return fetcher;
}

async function fetchNotifications(account: AccountInfo): Promise<Note[]> {
	return window.electronApi.getNotificationsForAccount(account);
}

async function getDemoNotifications(): Promise<Note[]> {
	currentDemoNotifications = [
		...currentDemoNotifications,
		...createDemoNotifications(),
	];
	return currentDemoNotifications;
}

export function getErrorHandler(dispatch: AppDispatch) {
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

		if (typeof err === 'object' && isTokenInvalid(err)) {
			const message = 'Notifications check failed the token is invalid';
			debug(message);
			window.electronApi.logMessage(message, 'warn');
			dispatch(changeToOffline());
			dispatch(setIsTokenInvalid(true));
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
		const message = `Notifications check failed but we do not know why. Error: ${getErrorMessage(
			err
		)}`;
		debug(message);
		window.electronApi.logMessage(message, 'error');
		const errorString = 'Error fetching notifications: ' + getErrorMessage(err);
		console.error(errorString); //eslint-disable-line no-console
		console.error(err); //eslint-disable-line no-console
		dispatch(addConnectionError(errorString));
	};
}
