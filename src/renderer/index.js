// require('dotenv').config();

// import { version } from '../../package.json';

import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { createLogger } from 'redux-logger';
// TODO: do we need unhandled?
// import unhandled from 'electron-unhandled';
import { Provider } from 'react-redux';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import App from './components/app';
import AppWrapper from './components/app-wrapper';

import { reducer } from './lib/reducer';
import { createFetcher } from './lib/gitnews-fetcher';
import { electronMiddleware } from './lib/electron-middleware';
import { configMiddleware } from './lib/config-middleware';
import { createGitHubMiddleware } from './lib/github-middleware';

import './styles.css';

const persistConfig = { key: 'gitnews-state', storage };
const persistedReducer = persistReducer(persistConfig, reducer);

const logger = createLogger({
	collapsed: true,
	level: 'info',
});

// Catch unhandled Promise rejections
// TODO: do we need unhandled?
// unhandled();

function quitApp() {
	window.electronApi.quitApp();
}

async function getVersion() {
	return window.electronApi.getVersion();
}

async function runApp() {
	const main = window.document.querySelector('#app');
	if (!main) {
		console.error('Could not find main element'); //eslint-disable-line no-console
		return;
	}
	const isDemoMode = await window.electronApi.isDemoMode();
	const githubMiddleware = createGitHubMiddleware(isDemoMode);
	const fetcher = createFetcher(isDemoMode);
	const store = createStore(
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

	ReactDOM.render(
		<Provider store={store}>
			<AppWrapper quitApp={quitApp}>
				<App getVersion={getVersion} quitApp={quitApp} />
			</AppWrapper>
		</Provider>,
		main
	);
}

runApp();
