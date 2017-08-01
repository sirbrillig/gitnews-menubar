/* globals window */
require( 'dotenv' ).config();
const { version } = require( './package.json' );
const { get } = require( 'lodash' );
const { shell, remote } = require( 'electron' );
const semver = require( 'semver' );
const { getNotifications } = require( 'gitnews' );
const React = require( 'react' );
const ReactDOM = require( 'react-dom' );
const el = React.createElement;
const debugFactory = require( 'debug' );
const debug = debugFactory( 'gitnews-menubar' );
const unhandled = require( 'electron-unhandled' );
const { getToken, setToken, msToSecs, isOfflineCode, bindToDispatch, getErrorMessage } = require( './lib/helpers' );
const { checkForUpdates } = require( './lib/updates' );
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
		// TODO: use actual Redux lib to get middleware options
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
		const lastChecked = get( this.state, 'lastChecked', 0 );
		const interval = ( this.state.fetchInterval - ( this.props.now() - lastChecked ) );
		return ( interval < 0 ) ? 0 : msToSecs( interval );
	}

	// TODO: change this to an action and have middleware handle fetch
	fetchNotifications( token = null ) {
		// TODO: have middleware de-duplicate requests without state change
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
		// NOTE: After this point, any return action MUST disable fetchingInProgress
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
				// TODO: add class of errors like offline which are any 500 error from GitHub
				const errorString = 'Error fetching notifications: ' + getErrorMessage( err );
				console.error( errorString );
				this.dispatch( addConnectionError( errorString ) );
			} );
	}

	openUrl( url ) {
		shell.openExternal( url );
	}

	checkForUpdates() {
		checkForUpdates( { fetch: window.fetch, version, semver } )
			.then( response => {
				if ( ! response.updateAvailable ) {
					remote.dialog.showMessageBox( {
						type: 'info',
						message: `You have the latest version of Gitnews, ${ response.oldVersion }!`,
					} );
					return;
				}
				const confirm = remote.dialog.showMessageBox( {
					type: 'question',
					message: 'A new version ' + response.newVersion + ' of Gitnews is available.',
					detail: 'Do you want to download it now?',
					buttons: [ 'Yes', 'No' ]
				} );
				if ( confirm === 0 ) {
					shell.openExternal( 'https://github.com/sirbrillig/gitnews-menubar/releases' );
				}
			} )
			.catch( err => {
				console.error( 'Error while checking for updates:', err );
			} );
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
			checkForUpdates: this.checkForUpdates,
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
	const now = Date.now;
	ReactDOM.render( el( AppState, { getNotifications, quitApp, getToken, version, now }, App ), main );
}

runApp();
