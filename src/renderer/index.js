// require('dotenv').config();

// import { version } from '../../package.json';

import React from 'react';
import ReactDOM from 'react-dom';
// TODO: https://www.electronjs.org/docs/latest/breaking-changes#removed-remote-module
// import { remote } from 'electron';
import { createStore, applyMiddleware } from 'redux';
import { createLogger } from 'redux-logger';
// import unhandled from 'electron-unhandled';
import { Provider } from 'react-redux';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// import App from './components/app';
// import AppWrapper from './components/app-wrapper';

// import { reducer } from 'common/lib/reducer';
// import { fetcher } from 'common/lib/gitnews-fetcher';
// import { electronMiddleware } from 'common/lib/electron-middleware';
// import { configMiddleware } from 'common/lib/config-middleware';
// import { githubMiddleware } from 'common/lib/github-middleware';

import './styles.css';

const persistConfig = { key: 'gitnews-state', storage };
// const persistedReducer = persistReducer(persistConfig, reducer);

const logger = createLogger({
	collapsed: true,
	level: 'info',
});

// Catch unhandled Promise rejections
// unhandled();

function quitApp() {
	window.electronApi.quitApp();
}

const version = '1.0.7'; // FXIME

function runApp() {
	const main = window.document.querySelector('#app');
	if (!main) {
		console.error('Could not find main element'); //eslint-disable-line no-console
		return;
	}
	// const store = createStore(
	// 	persistedReducer,
	// 	applyMiddleware(
	// 		configMiddleware,
	// 		electronMiddleware,
	// 		githubMiddleware,
	// 		fetcher,
	// 		logger
	// 	)
	// );
	// persistStore(store);

	ReactDOM.render(
		<TestComp />,
		main
	);
}

function TestComp() {
	return (
		<div>
		<h2>Hello world</h2>
			<button onClick={()=> quitApp()}>Quit</button>
		</div>
	);
}

runApp();
