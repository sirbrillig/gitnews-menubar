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

			if (action.type === 'SET_ACCOUNTS') {
				debug('Accounts changed; fetching with updated accounts');
				window.electronApi.logMessage(
					'Accounts changed; fetching with updated accounts',
					'info'
				);
				performFetch(store.getState(), next);
				return next(action);
			}

			if (action.type === 'GITNEWS_FETCH_NOTIFICATIONS') {
				debug('Fetching accounts');
				window.electronApi.logMessage('Fetching accounts', 'info');
				performFetch(store.getState(), next);
				return;
			}

			return next(action);
		};

	async function performFetch(state: AppReduxState, next: AppDispatch) {
		const fetchingMaxTime = secsToMs(120); // 2 minutes
		if (state.fetchingInProgress) {
			const timeSinceFetchingStarted =
				Date.now() - (state.fetchingStartedAt || 0);
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
		if (!state.token) {
			next(changeToOffline());
			return;
		}
		debug('fetching notifications in middleware');
		// NOTE: After this point, any return action MUST disable fetchingInProgress
		// or the app will get stuck never updating again.
		next(fetchBegin());

		const getGithubNotifications = getFetcher(state.accounts, state.isDemoMode);
		try {
			const notes = await getGithubNotifications();
			debug('notifications retrieved', notes);
			window.electronApi.logMessage(
				`Notifications retrieved (${notes.length} found in ${state.accounts.length} accounts)`,
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
			getErrorHandler(next)(err as Error, state.token);
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
