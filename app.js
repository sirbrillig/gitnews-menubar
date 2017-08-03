/* globals window */
require( 'dotenv' ).config();
const { version } = require( './package.json' );
const { remote } = require( 'electron' );
const { createStore } = require( 'redux' );
const { Provider } = require( 'react-redux' );
const { getNotifications } = require( 'gitnews' );
const React = require( 'react' );
const ReactDOM = require( 'react-dom' );
const unhandled = require( 'electron-unhandled' );
const AppWrapper = require( './components/app-wrapper' );
const App = require( './components/app' );
const { reducer } = require( './lib/reducer' );
const { checkForUpdates } = require( './lib/updates' );
const { setToken } = require( './lib/helpers' );

const el = React.createElement;

// Catch unhandled Promise rejections
unhandled();

function quitApp() {
	remote.app.quit();
}

function runApp() {
	const main = window.document.querySelector( '.main' );
	if ( ! main ) {
		console.error( 'Could not find main element' );
		return;
	}
	const store = createStore( reducer );
	const now = Date.now;
	ReactDOM.render(
		el( Provider, { store },
			el( AppWrapper, { getNotifications, setToken, checkForUpdates, quitApp, now, version }, App )
		),
		main );
}

runApp();
