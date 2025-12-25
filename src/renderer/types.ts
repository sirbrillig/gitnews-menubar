import {
	PANE_CONFIG,
	PANE_NOTIFICATIONS,
	PANE_MUTED_REPOS,
	PANE_ACCOUNTS,
	PANE_ACCOUNT_EDIT,
} from './lib/constants';
import type {
	NoteReason,
	Note,
	AccountInfo,
	FetchErrorObject,
} from '../shared-types';

export type { NoteReason, Note, AccountInfo, FetchErrorObject };

export type FilterType = NoteReason | 'all';

export interface AppReduxState {
	token: undefined | string;
	notes: Note[];
	errors: string[];
	mutedRepos: string[];
	fetchingInProgress: boolean;
	lastChecked: false | number;
	lastSuccessfulCheck: false | number;
	fetchingStartedAt: false | number;
	fetchInterval: number;
	fetchRetryCount: number;
	offline: boolean;
	isAutoLoadEnabled: boolean;
	filterType: FilterType;
	appVisible: boolean;
	isDemoMode: boolean;
	isLogging: boolean;
	isTokenInvalid: boolean;
	accounts: AccountInfo[];
	selectedAccount: AccountInfo | undefined;
}

export type ActionMuteRepo = { type: 'MUTE_REPO'; repo: string };
export type ActionUnmuteRepo = { type: 'UNMUTE_REPO'; repo: string };
export type ActionMarkRead = {
	type: 'MARK_NOTE_READ';
	token: string;
	note: Note;
};
export type ActionMarkUnread = { type: 'MARK_NOTE_UNREAD'; note: Note };
export type ActionClearErrors = { type: 'CLEAR_ERRORS' };
export type ActionMarkAllNotesSeen = { type: 'MARK_ALL_NOTES_SEEN' };
export type ActionInitToken = { type: 'SET_INITIAL_TOKEN'; token: string };
export type ActionSelectAccount = {
	type: 'SELECT_ACCOUNT';
	account: AccountInfo;
};
export type ActionInitSetAccounts = {
	type: 'SET_INITIAL_ACCOUNTS';
	accounts: AccountInfo[];
};
export type ActionSetAccounts = {
	type: 'SET_ACCOUNTS';
	accounts: AccountInfo[];
};
export type ActionToggleTokenInvalid = {
	type: 'SET_TOKEN_INVALID';
	accountId: string;
	isInvalid: boolean;
};
export type ActionToggleLogging = {
	type: 'TOGGLE_LOGGING';
	isLogging: boolean;
};
export type ActionChangeToOffline = { type: 'OFFLINE' };
export type ActionGotNotes = { type: 'NOTES_RETRIEVED'; notes: Note[] };
export type ActionAddConnectionError = {
	type: 'ADD_CONNECTION_ERROR';
	error: string;
};
export type ActionFetchBegin = { type: 'FETCH_BEGIN' };
export type ActionFetchEnd = { type: 'FETCH_END' };
export type ActionFetchNotifications = { type: 'GITNEWS_FETCH_NOTIFICATIONS' };
export type ActionOpenUrl = {
	type: 'OPEN_URL';
	url: string;
	options: Electron.OpenExternalOptions;
};
export type ActionSetIcon = { type: 'SET_ICON'; icon: IconType };
export type ActionChangeAutoLoad = {
	type: 'CHANGE_AUTO_LOAD';
	isEnabled: boolean;
};
export type ActionScrollToTop = { type: 'SCROLL_TO_TOP' };
export type ActionSetFilterType = {
	type: 'SET_FILTER_TYPE';
	filterType: FilterType;
};
export type MarkAppHidden = { type: 'NOTE_APP_VISIBLE'; visible: false };
export type MarkAppShown = { type: 'NOTE_APP_VISIBLE'; visible: true };
export type ActionSetDemoMode = { type: 'SET_DEMO_MODE'; isDemoMode: boolean };

export type AppReduxAction =
	| ActionInitSetAccounts
	| ActionSelectAccount
	| ActionMuteRepo
	| ActionUnmuteRepo
	| ActionMarkRead
	| ActionMarkUnread
	| ActionClearErrors
	| ActionMarkAllNotesSeen
	| ActionSetAccounts
	| ActionInitToken
	| ActionChangeToOffline
	| ActionGotNotes
	| ActionAddConnectionError
	| ActionFetchBegin
	| ActionFetchEnd
	| ActionFetchNotifications
	| ActionOpenUrl
	| ActionSetIcon
	| ActionChangeAutoLoad
	| ActionScrollToTop
	| ActionSetFilterType
	| MarkAppHidden
	| MarkAppShown
	| ActionSetDemoMode
	| ActionToggleTokenInvalid
	| ActionToggleLogging;

export type OpenUrl = (url: string) => void;

export type MarkRead = (token: string, note: Note) => void;

export type MarkUnread = (note: Note) => void;

export type ChangeAutoload = (isEnabled: boolean) => void;

export type MuteRepo = (repo: string) => void;

export type UnmuteRepo = (repo: string) => void;

export type IconType = 'normal' | 'unseen' | 'unread' | 'offline' | 'error';

export type QueuedAction = 'open' | 'markRead' | 'markUnread';

export type AppPane =
	| typeof PANE_ACCOUNTS
	| typeof PANE_ACCOUNT_EDIT
	| typeof PANE_NOTIFICATIONS
	| typeof PANE_CONFIG
	| typeof PANE_MUTED_REPOS;

export interface MainBridge {
	quitApp: () => void;
	logMessage: (message: string, level: 'info' | 'warn' | 'error') => void;
	toggleLogging: (isLogging: boolean) => void;
	toggleAutoLaunch: (isEnabled: boolean) => void;
	openUrl: OpenUrl;
	setIcon: (nextIcon: IconType) => void;
	onHide: (callback: () => void) => void;
	onShow: (callback: () => void) => void;
	onClick: (callback: () => void) => void;
	getToken: () => Promise<string>;
	getVersion: () => Promise<string>;
	getNotificationsForAccount: (
		account: AccountInfo
	) => Promise<Note[] | { error: Error }>;
	markNotificationRead: (note: Note, account: AccountInfo) => void;
	isDemoMode: () => Promise<boolean>;
	isAutoLaunchEnabled: () => Promise<boolean>;
	saveAccounts: (accounts: AccountInfo[]) => void;
	getAccounts: () => Promise<AccountInfo[]>;
}

export type UnknownFetchError = FetchErrorObject | string;

declare global {
	interface Window {
		electronApi: MainBridge;
	}
}
