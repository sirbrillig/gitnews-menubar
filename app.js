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
const { getToken, setToken, msToSecs, isOfflineCode } = require( './lib/helpers' );
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
} = require( './lib/reducer' );

// Catch unhandled Promise rejections
unhandled();

class AppState extends React.Component {
	constructor( props ) {
		super( props );
		const state = new State( reducer );
		// TODO: remove callback when unmounting
		state.addCallback( () => this.setState( state.getState() ) );
		this.dispatch = state.dispatch;
		this.state = {};

		this.openUrl = this.openUrl.bind( this );
		this.fetchNotifications = this.fetchNotifications.bind( this );
		this.writeToken = this.writeToken.bind( this );
		this.getSecondsUntilNextFetch = this.getSecondsUntilNextFetch.bind( this );
	}

	writeToken( token ) {
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
		if ( ! window.navigator.onLine ) {
			debug( 'skipping notifications check because we are offline' );
			this.dispatch( changeToOffline() );
			return;
		}
		debug( 'fetching notifications' );
		this.props.getNotifications( token || this.state.token )
			.then( notes => {
				debug( 'notifications retrieved', notes );
				this.dispatch( gotNotes( notes ) );
			} )
			.catch( err => {
				debug( 'fetching notifications failed with the error', err );
				if ( err.code === 'GitHubTokenNotFound' ) {
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

	bindToDispatch( action ) {
		return ( ...args ) => this.dispatch( action( args ) );
	}

	getActions() {
		return {
			hideEditToken: this.bindToDispatch( hideEditToken ),
			showEditToken: this.bindToDispatch( showEditToken ),
			hideConfig: this.bindToDispatch( hideConfig ),
			showConfig: this.bindToDispatch( showConfig ),
			markRead: this.bindToDispatch( markRead ),
			clearErrors: this.bindToDispatch( clearErrors ),
			markAllNotesSeen: this.bindToDispatch( markAllNotesSeen ),
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
