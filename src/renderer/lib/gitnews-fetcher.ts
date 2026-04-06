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
	isServerReturningHtml,
	isTokenInvalid,
} from '../lib/helpers';
import {
	changeToOffline,
	fetchBegin,
	fetchDone,
	gotNotes,
	addConnectionError,
	addAccountFetchError,
	setIsTokenInvalid,
} from '../lib/reducer';
import {
	type AccountInfo,
	AppReduxState,
	BasicNote,
	FetchErrorObject,
	FilterType,
	Note,
	UnknownFetchError,
} from '../types';
import { AppDispatch } from './store';
import { createDemoNotifications } from './demo-mode';

const debug = debugFactory('gitnews-menubar');

let currentDemoNotifications = createDemoNotifications();

function doesBasicNoteMatchFilter(
	note: BasicNote,
	filterType: FilterType
): boolean {
	if (filterType === 'all') return true;
	return note.reason === filterType;
}

export function createFetcher(): Middleware<unknown, AppReduxState> {
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
				try {
					performFetch(
						{
							...store.getState(),
							accounts: action.accounts,
						},
						next
					);
				} catch (err) {
					window.electronApi.logMessage(
						'Got an error fetching which somehow was not caught by the fetch handler',
						'error'
					);
					console.error(
						'Got an error fetching which somehow was not caught by the fetch handler',
						err
					);
				}
				return next(action);
			}

			// FIXME: why does this trigger so many times during a fetch?
			if (action.type === 'GITNEWS_FETCH_NOTIFICATIONS') {
				debug('Fetching accounts');
				window.electronApi.logMessage('Fetching accounts', 'info');
				try {
					performFetch(store.getState(), next);
				} catch (err) {
					window.electronApi.logMessage(
						'Got an error fetching which somehow was not caught by the fetch handler',
						'error'
					);
					console.error(
						'Got an error fetching which somehow was not caught by the fetch handler',
						err
					);
				}
				return;
			}

			if (action.type === 'SET_FILTER_TYPE') {
				next(action); // update state.filterType FIRST so performFetch reads the new value
				try {
					performFetch(store.getState(), next);
				} catch (err) {
					window.electronApi.logMessage(
						'Got an error fetching which somehow was not caught by the fetch handler',
						'error'
					);
					console.error(
						'Got an error fetching which somehow was not caught by the fetch handler',
						err
					);
				}
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
		if (state.accounts.length < 1) {
			next(changeToOffline());
			return;
		}
		debug('fetching notifications in middleware');

		try {
			// NOTE: After this point, any return action MUST disable fetchingInProgress
			// or the app will get stuck never updating again.
			next(fetchBegin());

			if (state.isDemoMode) {
				const allNotes = await getDemoNotifications();
				debug('notifications retrieved', allNotes);
				window.electronApi.logMessage(
					`Notifications retrieved (${allNotes.length} found in ${state.accounts.length} accounts)`,
					'info'
				);
				next(gotNotes(allNotes));
			} else {
				type AccountError = {
					account: AccountInfo;
					err: FetchErrorObject | unknown;
				};

				// Phase 1 — List basic notes for all accounts in parallel
				const allBasicNotes: BasicNote[] = [];
				const phase1Errors: AccountError[] = [];
				await Promise.all(
					state.accounts.map((account) => {
						window.electronApi.logMessage(
							`Fetching notifications for ${account.name} (${account.serverUrl})`,
							'info'
						);
						return window.electronApi
							.listBasicNotificationsForAccount(account)
							.then((result) => {
								if ('error' in result) {
									window.electronApi.logMessage(
										`Fetching notifications FAILED for ${account.name} (${account.serverUrl})`,
										'error'
									);
									phase1Errors.push({ account, err: result.error });
									return;
								}
								allBasicNotes.push(...result);
							})
							.catch((err) => {
								window.electronApi.logMessage(
									`Fetching notifications FAILED for ${account.name} (${account.serverUrl})`,
									'error'
								);
								phase1Errors.push({ account, err });
							});
					})
				);

				// Phase 2 — Filter (renderer-side)
				const locallyUnreadIds = new Set(
					(state.locallyUnreadNotes ?? []).map((n) => n.gitnewsAccountId + n.id)
				);
				const toEnrich = allBasicNotes.filter((note) => {
					if (locallyUnreadIds.has(note.gitnewsAccountId + note.id))
						return true;
					if (state.mutedRepos.includes(note.repositoryFullName)) return false;
					return doesBasicNoteMatchFilter(note, state.filterType);
				});

				// Phase 2.5 — Skip re-hydration for notes whose updatedAt hasn't changed
				const existingNotesByKey = new Map<string, Note>();
				for (const note of state.notes) {
					existingNotesByKey.set(note.gitnewsAccountId + note.id, note);
				}

				const allNotes: Note[] = [];
				const needsHydration: BasicNote[] = [];
				for (const basicNote of toEnrich) {
					const key = basicNote.gitnewsAccountId + basicNote.id;
					const existing = existingNotesByKey.get(key);
					if (
						existing &&
						existing.updatedAt === basicNote.updatedAt &&
						!existing.gitnewsIsInvalid
					) {
						debug(
							`Reusing cached hydration for note ${basicNote.id} (updatedAt: ${basicNote.updatedAt})`
						);
						window.electronApi.logMessage(
							`Reusing cached hydration for note ${basicNote.id} (updatedAt: ${basicNote.updatedAt})`,
							'info'
						);
						allNotes.push({
							...existing,
							unread: basicNote.unread,
							api: {
								...existing.api,
								notification: { reason: basicNote.reason },
							},
						});
					} else {
						needsHydration.push(basicNote);
					}
				}

				// Phase 3 — Enrich (grouped by account)
				const byAccount = new Map<string, BasicNote[]>();
				for (const note of needsHydration) {
					const group = byAccount.get(note.gitnewsAccountId) ?? [];
					group.push(note);
					byAccount.set(note.gitnewsAccountId, group);
				}
				const phase3Errors: AccountError[] = [];
				await Promise.all(
					[...byAccount.entries()].map(([accountId, notes]) => {
						const account = state.accounts.find((a) => a.id === accountId);
						if (!account) return Promise.resolve();
						return window.electronApi
							.enrichNotificationsForAccount(account, notes)
							.then((result) => {
								if ('error' in result) {
									phase3Errors.push({ account, err: result.error });
									return;
								}
								allNotes.push(...result);
							})
							.catch((err) => {
								phase3Errors.push({ account, err });
							});
					})
				);

				const allAccountErrors = [...phase1Errors, ...phase3Errors];
				const failedAccountIds = new Set(
					allAccountErrors.map((e) => e.account.id)
				);
				const anyAccountSucceeded = state.accounts.some(
					(a) => !failedAccountIds.has(a.id)
				);

				if (anyAccountSucceeded) {
					// Preserve existing notes from failed accounts so they don't disappear
					const preservedNotes = state.notes.filter((n) =>
						failedAccountIds.has(n.gitnewsAccountId)
					);
					allNotes.push(...preservedNotes);
				}

				allNotes.sort((a, b) => {
					if (a.updatedAt < b.updatedAt) return 1;
					if (a.updatedAt > b.updatedAt) return -1;
					return 0;
				});

				debug('notifications retrieved', allNotes);
				window.electronApi.logMessage(
					`Notifications retrieved (${allNotes.length} found in ${state.accounts.length} accounts, ${allAccountErrors.length} account(s) failed)`,
					'info'
				);

				if (anyAccountSucceeded) {
					// gotNotes clears errors[], so dispatch it before per-account errors
					next(gotNotes(allNotes));
				}

				for (const { account, err } of allAccountErrors) {
					dispatchAccountFetchError(next, account, err as FetchErrorObject);
				}
			}
		} catch (err) {
			debug('Fetching notifications threw an error', err);
			window.electronApi.logMessage(
				`Fetching notifications threw an error`,
				'warn'
			);
			getErrorHandler(next)(err as FetchErrorObject);
		} finally {
			next(fetchDone());
		}
	}

	return fetcher;
}

async function getDemoNotifications(): Promise<Note[]> {
	currentDemoNotifications = [
		...currentDemoNotifications,
		...createDemoNotifications(),
	];
	return currentDemoNotifications;
}

function dispatchAccountFetchError(
	dispatch: AppDispatch,
	account: AccountInfo,
	err: FetchErrorObject
) {
	dispatch(addAccountFetchError(account.id));
	if (typeof err === 'object' && isTokenInvalid(err)) {
		const message = `Token is invalid for account "${account.name}"`;
		debug(message);
		window.electronApi.logMessage(message, 'warn');
		dispatch(setIsTokenInvalid(err.accountId ?? account.id, true));
		return;
	}
	if (isServerReturningHtml(err as UnknownFetchError)) {
		const message = `GitHub Enterprise server for "${account.name}" is temporarily unavailable (server may be starting up)`;
		debug(message);
		window.electronApi.logMessage(message, 'warn');
		return;
	}
	const message = `Error fetching notifications for "${account.name}": ${getErrorMessage(err as UnknownFetchError)}`;
	debug(message);
	window.electronApi.logMessage(message, 'warn');
	dispatch(addConnectionError(message));
}

export function getErrorHandler(dispatch: AppDispatch) {
	return function handleFetchError(err: UnknownFetchError) {
		if (typeof err === 'object' && isTokenInvalid(err)) {
			const message = `Notifications check failed because the token is invalid for '${err.accountId ?? 'unknown'}'`;
			debug(message);
			window.electronApi.logMessage(message, 'warn');
			dispatch(changeToOffline());
			dispatch(setIsTokenInvalid(err.accountId ?? 'unknown', true));
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
		console.error('Raw error:', err); //eslint-disable-line no-console
		dispatch(addConnectionError(errorString));
	};
}
