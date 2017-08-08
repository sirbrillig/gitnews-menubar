/* globals window */
require( 'dotenv' ).config();
const { version } = require( './package.json' );
const { remote } = require( 'electron' );
const { createStore, applyMiddleware } = require( 'redux' );
const { Provider } = require( 'react-redux' );
const { getNotifications } = require( 'gitnews' );
const React = require( 'react' );
const ReactDOM = require( 'react-dom' );
const unhandled = require( 'electron-unhandled' );
const { logger } = require( 'redux-logger' );
const AppWrapper = require( './components/app-wrapper' );
const App = require( './components/app' );
const { reducer } = require( './lib/reducer' );
const { setToken } = require( './lib/helpers' );
const { fetcher } = require( './lib/gitnews-fetcher' );
const { electronMiddleware } = require( './lib/electron-middleware' );

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
	const store = createStore( reducer, applyMiddleware( electronMiddleware, fetcher, logger ) );
	const now = Date.now;
	ReactDOM.render(
		el( Provider, { store },
			el( AppWrapper, { getNotifications, setToken, quitApp, now, version }, App )
		),
		main );
}

runApp();
