import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { createLogger } from 'redux-logger';
import { Provider } from 'react-redux';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import App from './components/app';
import AppWrapper from './components/app-wrapper';

import { createReducer } from './lib/reducer';
import { createFetcher } from './lib/gitnews-fetcher';
import { electronMiddleware } from './lib/electron-middleware';
import { configMiddleware } from './lib/config-middleware';
import { createGitHubMiddleware } from './lib/github-middleware';

import './styles.css';
import { OpenUrl } from './types';

declare global {
	interface Window {
		electronApi: {
			quitApp: () => void;
			toggleAutoLaunch: (isEnabled: boolean) => void;
			openUrl: OpenUrl;
			saveToken: (token: string) => void;
			setIcon: (nextIcon: string) => void;
			onHide: (callback: () => void) => void;
			onShow: (callback: () => void) => void;
			onClick: (callback: () => void) => void;
			getToken: () => Promise<string>;
			getVersion: () => Promise<string>;
			isDemoMode: () => Promise<boolean>;
			isAutoLaunchEnabled: () => Promise<boolean>;
		};
	}
}

const persistConfig = { key: 'gitnews-state', storage };

const logger = createLogger({
	collapsed: true,
	level: 'info',
});

function quitApp(): void {
	window.electronApi.quitApp();
}

async function getVersion(): Promise<string> {
	return window.electronApi.getVersion();
}

async function runApp() {
	const main = window.document.querySelector('#app');
	if (!main) {
		console.error('Could not find main element'); //eslint-disable-line no-console
		return;
	}
	const isDemoMode = await window.electronApi.isDemoMode();
	const token = await window.electronApi.getToken();
	const githubMiddleware = createGitHubMiddleware(isDemoMode);
	const fetcher = createFetcher(isDemoMode);
	const reducer = createReducer(token);
	const persistedReducer = persistReducer(persistConfig, reducer);
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
