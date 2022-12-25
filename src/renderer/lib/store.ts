import { createStore, applyMiddleware } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import { createLogger } from 'redux-logger';
import storage from 'redux-persist/lib/storage';

import { createReducer } from '../lib/reducer';
import { createFetcher } from '../lib/gitnews-fetcher';
import { electronMiddleware } from '../lib/electron-middleware';
import { configMiddleware } from '../lib/config-middleware';
import { createGitHubMiddleware } from '../lib/github-middleware';

const persistConfig = { key: 'gitnews-state', storage };

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
persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
