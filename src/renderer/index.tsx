import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import App from './components/app';
import AppWrapper from './components/app-wrapper';
import { initToken, setIsDemoMode } from './lib/reducer';
import { store } from './lib/store';

import './styles.css';

function quitApp(): void {
	window.electronApi.quitApp();
}

async function getVersion(): Promise<string> {
	return window.electronApi.getVersion();
}

async function runApp() {
	window.electronApi.logMessage('Initializing renderer', 'info');
	const main = window.document.querySelector('#app');
	if (!main) {
		console.error('Could not find main element'); //eslint-disable-line no-console
		return;
	}

	const isDemoMode = await window.electronApi.isDemoMode();
	const token = await window.electronApi.getToken();
	window.electronApi.logMessage('Initializing token to saved value', 'info');
	store.dispatch(setIsDemoMode(isDemoMode));
	store.dispatch(initToken(token));

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
