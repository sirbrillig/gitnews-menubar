import {
	secsToMs,
	getNoteId,
	mergeNotifications,
	getFetchInterval,
} from '../lib/helpers';
import {
	AppReduxState,
	AppReduxAction,
	Note,
	ActionSetAccounts,
	ActionSetDemoMode,
	ActionChangeToOffline,
	ActionGotNotes,
	ActionAddConnectionError,
	ActionAddAccountFetchError,
	ActionFetchBegin,
	ActionFetchEnd,
	ActionMarkAllNotesSeen,
	ActionClearErrors,
	ActionMarkUnread,
	ActionMarkRead,
	ActionUnmuteRepo,
	ActionMuteRepo,
	ActionInitToken,
	FilterType,
	ActionToggleTokenInvalid,
	AccountInfo,
	ActionSelectAccount,
	ActionInitSetAccounts,
	ActionUnsubscribeNote,
} from '../types';

const defaultFetchInterval = secsToMs(120);

const initialState: AppReduxState = {
	token: undefined,
	notes: [],
	errors: [],
	accountsWithFetchErrors: [],
	mutedRepos: [],
	fetchingInProgress: false,
	lastChecked: false,
	lastSuccessfulCheck: false,
	fetchingStartedAt: false,
	fetchInterval: defaultFetchInterval,
	fetchRetryCount: 0,
	offline: false,
	isAutoLoadEnabled: false,
	filterType: 'all',
	appVisible: false,
	isDemoMode: false,
	isLogging: false,
	isTokenInvalid: false,
	accounts: [],
	selectedAccount: undefined,
	locallyUnreadNotes: [],
	showUnreadOnly: false,
};

function setAllAccountsValid(accounts: AccountInfo[]): AccountInfo[] {
	return accounts.map((account) => {
		return {
			...account,
			isInvalid: false,
		};
	});
}

function setAccountInvalid(
	allAccounts: AccountInfo[],
	accountId: string,
	isInvalid: boolean
): AccountInfo[] {
	let accounts = allAccounts.filter((acc) => acc.id !== accountId);
	const account = allAccounts.find((acc) => acc.id === accountId);
	if (account) {
		accounts = [
			...accounts,
			{
				...account,
				isInvalid,
			},
		];
	}
	return accounts;
}

export function createReducer() {
	return function (
		state: AppReduxState | undefined,
		action: AppReduxAction
	): AppReduxState {
		if (!state) {
			state = { ...initialState };
		}
		switch (action.type) {
			case 'SET_TOKEN_INVALID':
				return {
					...state,
					isTokenInvalid: action.isInvalid,
					accounts: setAccountInvalid(state.accounts, action.accountId, true),
				};
			case 'TOGGLE_LOGGING':
				return { ...state, isLogging: action.isLogging };
			case 'SET_DEMO_MODE':
				return { ...state, isDemoMode: action.isDemoMode };
			case 'NOTE_APP_VISIBLE':
				return { ...state, appVisible: action.visible };
			case 'FETCH_BEGIN':
				return Object.assign({}, state, {
					fetchingInProgress: true,
					fetchingStartedAt: Date.now(),
				});
			case 'FETCH_END':
				return Object.assign({}, state, { fetchingInProgress: false });
			case 'ADD_CONNECTION_ERROR':
				return Object.assign({}, state, {
					errors: [...state.errors, action.error],
					lastChecked: Date.now(),
				});
			case 'ADD_ACCOUNT_FETCH_ERROR':
				return {
					...state,
					accountsWithFetchErrors: state.accountsWithFetchErrors.includes(
						action.accountId
					)
						? state.accountsWithFetchErrors
						: [...state.accountsWithFetchErrors, action.accountId],
				};
			case 'CLEAR_ERRORS':
				return Object.assign({}, state, { errors: [] });
			case 'MARK_NOTE_UNREAD': {
				const noteId = getNoteId(action.note);
				const existingLocallyUnread = state.locallyUnreadNotes ?? [];
				const filtered = existingLocallyUnread.filter(
					(n) => getNoteId(n) !== noteId
				);
				return {
					...state,
					notes: state.notes.map((note) =>
						getNoteId(note) === noteId
							? { ...note, gitnewsMarkedUnread: true }
							: note
					),
					locallyUnreadNotes: [...filtered, action.note],
				};
			}
			case 'MARK_NOTE_READ': {
				const noteId = getNoteId(action.note);
				return {
					...state,
					notes: state.notes.map((note) =>
						getNoteId(note) === noteId
							? { ...note, unread: false, gitnewsMarkedUnread: false }
							: note
					),
					locallyUnreadNotes: (state.locallyUnreadNotes ?? []).filter(
						(n) => getNoteId(n) !== noteId
					),
				};
			}
			case 'UNSUBSCRIBE_NOTE': {
				const noteId = getNoteId(action.note);
				return {
					...state,
					notes: state.notes.filter((note) => getNoteId(note) !== noteId),
					locallyUnreadNotes: (state.locallyUnreadNotes ?? []).filter(
						(n) => getNoteId(n) !== noteId
					),
				};
			}
			case 'MARK_ALL_NOTES_SEEN': {
				const notes = state.notes
					.filter((x) => x.api)
					.map((note) => ({
						...note,
						gitnewsSeen: true,
						gitnewsSeenAt: Date.now(),
					}));
				return { ...state, notes };
			}
			case 'SET_INITIAL_ACCOUNTS':
			case 'SET_ACCOUNTS':
				return {
					...state,
					accounts: setAllAccountsValid(action.accounts),
				};
			case 'SELECT_ACCOUNT':
				return {
					...state,
					selectedAccount: action.account,
				};
			case 'SET_INITIAL_TOKEN':
				return Object.assign({}, state, {
					token: action.token,
					isTokenInvalid: false,
				});
			case 'OFFLINE':
				return Object.assign({}, state, {
					offline: true,
					lastChecked: Date.now(),
					fetchInterval: getFetchInterval(secsToMs(60), state.fetchRetryCount),
					fetchRetryCount: state.fetchRetryCount + 1,
				});
			case 'NOTES_RETRIEVED': {
				const newNotes = mergeNotifications(state.notes, action.notes);
				const mergedIds = new Set(newNotes.map(getNoteId));
				const existingLocallyUnread = state.locallyUnreadNotes ?? [];

				// Re-inject locally-unread notes that fell off the GitHub response
				const notesToReinsert = existingLocallyUnread
					.filter((note) => !mergedIds.has(getNoteId(note)))
					.map((note) => ({ ...note, gitnewsMarkedUnread: true }));
				const allNotes = [...newNotes, ...notesToReinsert];

				// Update stored copies with latest data from fetch (keeps backup fresh)
				const freshById = new Map(newNotes.map((n) => [getNoteId(n), n]));
				const updatedLocallyUnread = existingLocallyUnread.map(
					(localNote) => {
						const fresh = freshById.get(getNoteId(localNote));
						return fresh ? { ...fresh, gitnewsMarkedUnread: true } : localNote;
					}
				);

				const unseen = allNotes.filter((note) => !note.gitnewsSeen);
				const unread = allNotes.filter((note) => note.unread);
				window.electronApi?.logMessage(
					`Storing notifications in store. ${unseen.length} unseen/${unread.length} unread/${allNotes.length} total`,
					'info'
				);
				unseen.forEach((note) => {
					window.electronApi?.logMessage(`Unseen: ${note.title}`, 'info');
				});
				return {
					...state,
					offline: false,
					isTokenInvalid: false,
					lastChecked: Date.now(),
					lastSuccessfulCheck: Date.now(),
					fetchRetryCount: 0,
					errors: [],
					accountsWithFetchErrors: [],
					fetchInterval: defaultFetchInterval,
					notes: allNotes,
					locallyUnreadNotes: updatedLocallyUnread,
				};
			}
			case 'CHANGE_AUTO_LOAD':
				return Object.assign({}, state, {
					isAutoLoadEnabled: action.isEnabled,
				});
			case 'MUTE_REPO':
				return { ...state, mutedRepos: [...state.mutedRepos, action.repo] };
			case 'UNMUTE_REPO':
				return {
					...state,
					mutedRepos: state.mutedRepos.filter(
						(repoName) => repoName !== action.repo
					),
				};
			case 'SET_FILTER_TYPE':
				return { ...state, filterType: action.filterType };
			case 'SET_SHOW_UNREAD_ONLY':
				return { ...state, showUnreadOnly: action.showUnreadOnly };
		}
		return state;
	};
}

export function muteRepo(repo: string): ActionMuteRepo {
	return { type: 'MUTE_REPO', repo };
}

export function unmuteRepo(repo: string): ActionUnmuteRepo {
	return { type: 'UNMUTE_REPO', repo };
}

export function setAccounts(accounts: AccountInfo[]): ActionSetAccounts {
	return { type: 'SET_ACCOUNTS', accounts };
}

export function markRead(token: string, note: Note): ActionMarkRead {
	return { type: 'MARK_NOTE_READ', token, note };
}

export function markUnread(note: Note): ActionMarkUnread {
	return { type: 'MARK_NOTE_UNREAD', note };
}

export function unsubscribeNote(note: Note): ActionUnsubscribeNote {
	return { type: 'UNSUBSCRIBE_NOTE', note };
}

export function clearErrors(): ActionClearErrors {
	return { type: 'CLEAR_ERRORS' };
}

export function markAllNotesSeen(): ActionMarkAllNotesSeen {
	return { type: 'MARK_ALL_NOTES_SEEN' };
}

export function initToken(token: string): ActionInitToken {
	return { type: 'SET_INITIAL_TOKEN', token };
}

export function initAccounts(accounts: AccountInfo[]): ActionInitSetAccounts {
	return { type: 'SET_INITIAL_ACCOUNTS', accounts };
}

export function selectAccount(account: AccountInfo): ActionSelectAccount {
	return { type: 'SELECT_ACCOUNT', account };
}

export function setIsDemoMode(isDemoMode: boolean): ActionSetDemoMode {
	return { type: 'SET_DEMO_MODE', isDemoMode };
}

export function setIsTokenInvalid(
	accountId: string,
	isInvalid: boolean
): ActionToggleTokenInvalid {
	return { type: 'SET_TOKEN_INVALID', accountId, isInvalid };
}

export function changeToOffline(): ActionChangeToOffline {
	return { type: 'OFFLINE' };
}

export function gotNotes(notes: Note[]): ActionGotNotes {
	return { type: 'NOTES_RETRIEVED', notes };
}

export function addConnectionError(error: string): ActionAddConnectionError {
	return { type: 'ADD_CONNECTION_ERROR', error };
}

export function addAccountFetchError(
	accountId: string
): ActionAddAccountFetchError {
	return { type: 'ADD_ACCOUNT_FETCH_ERROR', accountId };
}

export function fetchBegin(): ActionFetchBegin {
	return { type: 'FETCH_BEGIN' };
}

export function fetchDone(): ActionFetchEnd {
	return { type: 'FETCH_END' };
}

export function fetchNotifications() {
	return { type: 'GITNEWS_FETCH_NOTIFICATIONS' };
}

export function openUrl(
	url: string,
	noteToMarkRead?: { token: string; note: Note }
) {
	return { type: 'OPEN_URL', url, noteToMarkRead };
}

export function setIcon(icon: string) {
	return { type: 'SET_ICON', icon };
}

export function changeAutoLoad(isEnabled: boolean) {
	return { type: 'CHANGE_AUTO_LOAD', isEnabled };
}

export function scrollToTop() {
	return { type: 'SCROLL_TO_TOP' };
}

export function setFilterType(filterType: FilterType) {
	return { type: 'SET_FILTER_TYPE', filterType };
}

export function setShowUnreadOnly(showUnreadOnly: boolean) {
	return { type: 'SET_SHOW_UNREAD_ONLY', showUnreadOnly };
}

export function markAppHidden() {
	return { type: 'NOTE_APP_VISIBLE', visible: false };
}

export function markAppShown() {
	return { type: 'NOTE_APP_VISIBLE', visible: true };
}

export function toggleLogging(isLogging: boolean) {
	return { type: 'TOGGLE_LOGGING', isLogging };
}
