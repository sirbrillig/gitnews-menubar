require('dotenv').config();

import { version } from '../../package.json';

import React from 'react';
import ReactDOM from 'react-dom';
import { remote } from 'electron';
import { createStore, applyMiddleware } from 'redux';
import { createLogger } from 'redux-logger';
import unhandled from 'electron-unhandled';
import { Provider } from 'react-redux';
import { persistStore, persistReducer } from 'redux-persist';
import { PersistGate } from 'redux-persist/es/integration/react';
import storage from 'redux-persist/lib/storage';

import App from './components/app';
import AppWrapper from './components/app-wrapper';

import { reducer } from 'common/lib/reducer';
import { fetcher } from 'common/lib/gitnews-fetcher';
import { electronMiddleware } from 'common/lib/electron-middleware';
import { configMiddleware } from 'common/lib/config-middleware';
import { githubMiddleware } from 'common/lib/github-middleware';

import './styles.css';

const stateFieldsToPersist = [
	'token',
	'notes',
	'mutedRepos',
	'isAutoLoadEnabled',
	'filterType',
];
const persistConfig = {
	key: 'gitnews-state',
	storage,
	whitelist: stateFieldsToPersist,
};
const persistedReducer = persistReducer(persistConfig, reducer);

const logger = createLogger({
	collapsed: true,
	level: 'info',
});

// Catch unhandled Promise rejections
unhandled();

function quitApp() {
	remote.app.quit();
}

function runApp() {
	const main = window.document.querySelector('#app');
	if (!main) {
		console.error('Could not find main element'); //eslint-disable-line no-console
		return;
	}
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
	const persistor = persistStore(store);

	ReactDOM.render(
		<Provider store={store}>
			<PersistGate loading={<Loading />} persistor={persistor}>
				<AppWrapper quitApp={quitApp} version={version}>
					<App version={version} quitApp={quitApp} />
				</AppWrapper>
			</PersistGate>
		</Provider>,
		main
	);
}

function Loading() {
	return (
		<>
			<div className="app-loading-spinner">
				<div className="double-bounce1"></div>
				<div className="double-bounce2"></div>
			</div>
			<div className="app-loading-text">
				Loading. Restoring previous data...
			</div>
		</>
	);
}

runApp();
