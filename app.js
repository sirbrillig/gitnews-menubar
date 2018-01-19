/* globals window */
require( 'dotenv' ).config();
const { version } = require( './package.json' );
const { remote } = require( 'electron' );
const { createStore, applyMiddleware } = require( 'redux' );
const { Provider } = require( 'react-redux' );
const React = require( 'react' );
const ReactDOM = require( 'react-dom' );
const unhandled = require( 'electron-unhandled' );
const { createLogger } = require( 'redux-logger' );
const AppWrapper = require( './components/app-wrapper' );
const App = require( './components/app' );
const { reducer } = require( './lib/reducer' );
const { fetcher } = require( './lib/gitnews-fetcher' );
const { electronMiddleware } = require( './lib/electron-middleware' );
const { configMiddleware } = require( './lib/config-middleware' );
const { githubMiddleware } = require( './lib/github-middleware' );

const el = React.createElement;
const logger = createLogger( {
	collapsed: true,
	level: 'info',
} );

// https://sentry.io/ Error reporting
if ( window.Raven ) {
	window.Raven.config( 'https://d8eec1c8e2f846ac951aff7b04cfb4fe@sentry.io/201433' ).install();
}

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
	const store = createStore( reducer, applyMiddleware( configMiddleware, electronMiddleware, githubMiddleware, fetcher, logger ) );
	ReactDOM.render(
		el( Provider, { store },
			el( AppWrapper, { quitApp, version }, App )
		),
		main );
}

runApp();
