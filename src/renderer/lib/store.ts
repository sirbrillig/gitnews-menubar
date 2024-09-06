import { createStore, applyMiddleware } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import { createLogger } from 'redux-logger';
import storage from 'redux-persist/lib/storage';

import { createReducer } from '../lib/reducer.ts';
import { createFetcher } from '../lib/gitnews-fetcher.ts';
import { electronMiddleware } from '../lib/electron-middleware.ts';
import { configMiddleware } from '../lib/config-middleware.ts';
import { createGitHubMiddleware } from '../lib/github-middleware.ts';

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
