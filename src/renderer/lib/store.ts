import { createStore, applyMiddleware } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import { createLogger } from 'redux-logger';
import type { PersistConfig } from 'redux-persist';

import { createReducer } from '../lib/reducer';
import { createFetcher } from '../lib/gitnews-fetcher';
import { electronMiddleware } from '../lib/electron-middleware';
import { configMiddleware } from '../lib/config-middleware';
import { createGitHubMiddleware } from '../lib/github-middleware';
import { createMainStorage } from '../lib/main-storage';
import type { AppReduxState } from '../types';

// Only state that should survive a restart. Everything else (fetch status,
// errors, visibility) is reset on launch; token and accounts come from the
// main process.
const persistedKeys: Array<keyof AppReduxState> = [
	'notes',
	'mutedRepos',
	'locallyUnreadNotes',
	'filterType',
	'showUnreadOnly',
	'isAutoLoadEnabled',
	'isLogging',
	'isLowPriorityEnabled',
	'lowPriorityTitlePatterns',
	'isGroupByRepoEnabled',
	'dismissedFeatureTips',
	'lastFeatureTipDismissedAt',
	'selectedAccount',
	'lastSuccessfulCheck',
];

const persistConfig: PersistConfig<AppReduxState> = {
	key: 'gitnews-state',
	storage: createMainStorage(persistedKeys),
	whitelist: persistedKeys,
	// Each write is an IPC call and a disk write, so batch rapid changes.
	throttle: 1000,
};

const logger = createLogger({
	collapsed: true,
	level: 'info',
});

const githubMiddleware = createGitHubMiddleware();
const fetcher = createFetcher();
const reducer = createReducer();
const persistedReducer = persistReducer(persistConfig, reducer);
export const store = createStore(
	persistedReducer,
	applyMiddleware(
		configMiddleware,
		electronMiddleware,
		githubMiddleware,
		fetcher,
		logger
	)
);
export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
