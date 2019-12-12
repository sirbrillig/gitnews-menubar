/* eslint-disable wpcalypso/import-docblock */
/* globals window */

require( 'dotenv' ).config();
const { version } = require( '../../package.json' );
const { remote } = require( 'electron' );
const { createStore, applyMiddleware } = require( 'redux' );
const { Provider } = require( 'react-redux' );
const React = require( 'react' );
const ReactDOM = require( 'react-dom' );
const unhandled = require( 'electron-unhandled' );
const { createLogger } = require( 'redux-logger' );
const AppWrapper = require( './components/app-wrapper' );
const App = require( './components/app' );
const { reducer } = require( 'common/lib/reducer' );
const { fetcher } = require( 'common/lib/gitnews-fetcher' );
const { electronMiddleware } = require( 'common/lib/electron-middleware' );
const { configMiddleware } = require( 'common/lib/config-middleware' );
const { githubMiddleware } = require( 'common/lib/github-middleware' );
const { persistStore, persistReducer } = require( 'redux-persist' );
const storage = require( 'redux-persist/lib/storage' ).default;

import './styles.css';

const persistConfig = { key: 'gitnews-state', storage };
const persistedReducer = persistReducer( persistConfig, reducer );

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
	const main = window.document.querySelector( '#app' );
	if ( ! main ) {
		console.error( 'Could not find main element' );
		return;
	}
	const store = createStore( persistedReducer, applyMiddleware( configMiddleware, electronMiddleware, githubMiddleware, fetcher, logger ) );
	persistStore( store );

	ReactDOM.render(
		<Provider store={store}>
			<AppWrapper quitApp={quitApp} version={version}>
				<App version={ version } quitApp={ quitApp } />
			</AppWrapper>
		</Provider>,
		main );
}

runApp();
