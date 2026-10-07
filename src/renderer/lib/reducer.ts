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
	ActionUndoUnsubscribeNote,
	ActionDismissUnsubscribedNotice,
	MarkReadSource,
	ActionSetLowPriorityEnabled,
	ActionSetGroupByRepoEnabled,
	ActionSetLowPriorityTitlePatterns,
	ActionDismissFeatureTip,
	ActionResetFeatureTips,
	FeatureTipId,
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
	recentlyUnsubscribed: [],
	isLowPriorityEnabled: false,
	lowPriorityTitlePatterns: {},
	isGroupByRepoEnabled: false,
	dismissedFeatureTips: [],
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
					lastChecked: Date.now(),
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
				const isDismissed = action.source === 'dismiss';
				return {
					...state,
					notes: state.notes.map((note) =>
						getNoteId(note) === noteId
							? {
									...note,
									unread: false,
									gitnewsMarkedUnread: false,
									gitnewsOpenedAt: Date.now(),
									// Remember notes dismissed without being opened so that
									// minor follow-up activity can be shown as low priority.
									gitnewsDismissedAt: isDismissed ? Date.now() : undefined,
									gitnewsDismissedReason: isDismissed
										? note.api?.notification?.reason
										: undefined,
									gitnewsDismissedCommentUrl: isDismissed
										? note.commentUrl
										: undefined,
								}
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
					// Keep a reference to the note briefly so the user has a way to get
					// back to the thread; once it's gone there's no way to find it.
					recentlyUnsubscribed: [
						...(state.recentlyUnsubscribed ?? []).filter(
							(item) => getNoteId(item.note) !== noteId
						),
						{ note: action.note, unsubscribedAt: Date.now() },
					],
				};
			}
			case 'UNDO_UNSUBSCRIBE_NOTE': {
				const noteId = getNoteId(action.note);
				// Unsubscribing also marked the note as read on GitHub, which cannot
				// be reversed through the API, so keep it unread locally instead.
				const restoredNote = action.note.unread
					? { ...action.note, gitnewsMarkedUnread: true }
					: action.note;
				return {
					...state,
					notes: [
						...state.notes.filter((note) => getNoteId(note) !== noteId),
						restoredNote,
					],
					locallyUnreadNotes: action.note.unread
						? [
								...(state.locallyUnreadNotes ?? []).filter(
									(n) => getNoteId(n) !== noteId
								),
								action.note,
							]
						: state.locallyUnreadNotes,
					recentlyUnsubscribed: (state.recentlyUnsubscribed ?? []).filter(
						(item) => getNoteId(item.note) !== noteId
					),
				};
			}
			case 'DISMISS_UNSUBSCRIBED_NOTICE':
				return {
					...state,
					recentlyUnsubscribed: (state.recentlyUnsubscribed ?? []).filter(
						(item) => getNoteId(item.note) !== action.noteId
					),
				};
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
				const updatedLocallyUnread = existingLocallyUnread.map((localNote) => {
					const fresh = freshById.get(getNoteId(localNote));
					return fresh ? { ...fresh, gitnewsMarkedUnread: true } : localNote;
				});

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
			case 'SET_LOW_PRIORITY_ENABLED':
				return { ...state, isLowPriorityEnabled: action.isEnabled };
			case 'SET_GROUP_BY_REPO_ENABLED':
				return { ...state, isGroupByRepoEnabled: action.isEnabled };
			case 'DISMISS_FEATURE_TIP': {
				const dismissedFeatureTips = state.dismissedFeatureTips ?? [];
				if (dismissedFeatureTips.includes(action.tipId)) {
					return state;
				}
				return {
					...state,
					dismissedFeatureTips: [...dismissedFeatureTips, action.tipId],
				};
			}
			case 'RESET_FEATURE_TIPS':
				return { ...state, dismissedFeatureTips: [] };
			case 'SET_LOW_PRIORITY_TITLE_PATTERNS': {
				const repo = action.repo.trim().toLowerCase();
				const patterns = action.patterns.filter(
					(pattern) => pattern.trim() !== ''
				);
				const { [repo]: _removed, ...otherRepos } =
					state.lowPriorityTitlePatterns ?? {};
				return {
					...state,
					lowPriorityTitlePatterns:
						patterns.length > 0
							? { ...otherRepos, [repo]: patterns }
							: otherRepos,
				};
			}
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

export function markRead(
	token: string,
	note: Note,
	source?: MarkReadSource
): ActionMarkRead {
	return { type: 'MARK_NOTE_READ', token, note, source };
}

export function markUnread(note: Note): ActionMarkUnread {
	return { type: 'MARK_NOTE_UNREAD', note };
}

export function unsubscribeNote(note: Note): ActionUnsubscribeNote {
	return { type: 'UNSUBSCRIBE_NOTE', note };
}

export function undoUnsubscribeNote(note: Note): ActionUndoUnsubscribeNote {
	return { type: 'UNDO_UNSUBSCRIBE_NOTE', note };
}

export function dismissUnsubscribedNotice(
	noteId: string
): ActionDismissUnsubscribedNotice {
	return { type: 'DISMISS_UNSUBSCRIBED_NOTICE', noteId };
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

export function setLowPriorityEnabled(
	isEnabled: boolean
): ActionSetLowPriorityEnabled {
	return { type: 'SET_LOW_PRIORITY_ENABLED', isEnabled };
}

export function setGroupByRepoEnabled(
	isEnabled: boolean
): ActionSetGroupByRepoEnabled {
	return { type: 'SET_GROUP_BY_REPO_ENABLED', isEnabled };
}

export function dismissFeatureTip(
	tipId: FeatureTipId
): ActionDismissFeatureTip {
	return { type: 'DISMISS_FEATURE_TIP', tipId };
}

export function resetFeatureTips(): ActionResetFeatureTips {
	return { type: 'RESET_FEATURE_TIPS' };
}

/**
 * Replace the title patterns for a repo. Empty patterns are dropped, and a repo
 * with no patterns is removed.
 */
export function setLowPriorityTitlePatterns(
	repo: string,
	patterns: string[]
): ActionSetLowPriorityTitlePatterns {
	return { type: 'SET_LOW_PRIORITY_TITLE_PATTERNS', repo, patterns };
}

export function toggleLogging(isLogging: boolean) {
	return { type: 'TOGGLE_LOGGING', isLogging };
}
