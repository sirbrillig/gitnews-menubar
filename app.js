/* globals window */
require( 'dotenv' ).config();
const { shell, remote } = require( 'electron' );
const { getNotifications } = require( 'gitnews' );
const React = require( 'react' );
const ReactDOM = require( 'react-dom' );
const el = React.createElement;
const debugFactory = require( 'debug' );
const debug = debugFactory( 'gitnews-menubar' );
const unhandled = require( 'electron-unhandled' );
const { getToken, setToken, msToSecs, isOfflineCode, bindToDispatch } = require( './lib/helpers' );
const App = require( './components/app' );
const State = require( './lib/state' );
const {
	reducer,
	changeToken,
	changeToOffline,
	gotNotes,
	addConnectionError,
	showEditToken,
	hideEditToken,
	hideConfig,
	showConfig,
	clearErrors,
	markAllNotesSeen,
	markRead,
	fetchingInProgress,
	fetchDone,
} = require( './lib/reducer' );

// Catch unhandled Promise rejections
unhandled();

class AppState extends React.Component {
	constructor( props ) {
		super( props );
		const state = new State( reducer );
		// TODO: remove callback when unmounting
		this.state = state.getState();
		state.addCallback( () => this.setState( state.getState() ) );
		this.dispatch = state.dispatch;

		this.openUrl = this.openUrl.bind( this );
		this.fetchNotifications = this.fetchNotifications.bind( this );
		this.writeToken = this.writeToken.bind( this );
		this.getSecondsUntilNextFetch = this.getSecondsUntilNextFetch.bind( this );
	}

	writeToken( token ) {
		debug( 'writing new token' );
		setToken( token );
		this.dispatch( changeToken( token ) );
		this.fetchNotifications( token );
	}

	getSecondsUntilNextFetch() {
		if ( ! this.state.lastChecked ) {
			return msToSecs( this.state.fetchInterval );
		}
		const interval = ( this.state.fetchInterval - ( Date.now() - this.state.lastChecked ) );
		if ( interval < 0 ) {
			return 0;
		}
		return msToSecs( interval );
	}

	fetchNotifications( token = null ) {
		if ( this.state.fetchingInProgress ) {
			debug( 'skipping notifications check because we are already fetching' );
			return;
		}
		if ( ! window.navigator.onLine ) {
			debug( 'skipping notifications check because we are offline' );
			this.dispatch( changeToOffline() );
			return;
		}
		debug( 'fetching notifications' );
		this.dispatch( fetchingInProgress() );
		this.props.getNotifications( token || this.state.token )
			.then( notes => {
				debug( 'notifications retrieved', notes );
				this.dispatch( gotNotes( notes ) );
			} )
			.catch( err => {
				debug( 'fetching notifications failed with the error', err );
				if ( err.code === 'GitHubTokenNotFound' ) {
					this.dispatch( fetchDone() );
					return; // This is handled in render
				}
				if ( isOfflineCode( err.code ) ) {
					debug( 'notifications check failed because we are offline' );
					this.dispatch( changeToOffline() );
					return;
				}
				const errorString = 'Error fetching notifications: ' + err;
				console.error( errorString );
				this.dispatch( addConnectionError( errorString ) );
			} );
	}

	openUrl( url ) {
		shell.openExternal( url );
	}

	getActions() {
		return {
			hideEditToken: bindToDispatch( this.dispatch, hideEditToken ),
			showEditToken: bindToDispatch( this.dispatch, showEditToken ),
			hideConfig: bindToDispatch( this.dispatch, hideConfig ),
			showConfig: bindToDispatch( this.dispatch, showConfig ),
			markRead: bindToDispatch( this.dispatch, markRead ),
			clearErrors: bindToDispatch( this.dispatch, clearErrors ),
			markAllNotesSeen: bindToDispatch( this.dispatch, markAllNotesSeen ),
			openUrl: this.openUrl,
			fetchNotifications: this.fetchNotifications,
			writeToken: this.writeToken,
			getSecondsUntilNextFetch: this.getSecondsUntilNextFetch,
		};
	}

	render() {
		return el( this.props.children, Object.assign( {}, this.state, this.props, this.getActions() ) );
	}
}

function quitApp() {
	remote.app.quit();
}

function runApp() {
	const main = window.document.querySelector( '.main' );
	if ( ! main ) {
		console.error( 'Could not find main element' );
		return;
	}
	ReactDOM.render( el( AppState, { getNotifications, quitApp, getToken }, App ), main );
}

runApp();
