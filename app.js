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
const { getNoteId, getToken, setToken, mergeNotifications, msToSecs, secsToMs } = require( './lib/helpers' );
const { PANE_NOTIFICATIONS, PANE_CONFIG, PANE_TOKEN } = require( './lib/constants' );
const App = require( './components/app' );

const defaultFetchInterval = secsToMs( 120 );

// Catch unhandled Promise rejections
unhandled();

class AppState extends React.Component {
	constructor( props ) {
		super( props );
		this.state = {
			token: props.getToken(),
			notes: [],
			errors: [],
			lastChecked: false,
			lastSuccessfulCheck: false,
			fetchInterval: defaultFetchInterval,
			offline: false,
			currentPane: PANE_NOTIFICATIONS,
		};

		this.hideEditToken = this.hideEditToken.bind( this );
		this.showEditToken = this.showEditToken.bind( this );
		this.hideConfig = this.hideConfig.bind( this );
		this.showConfig = this.showConfig.bind( this );
		this.markRead = this.markRead.bind( this );
		this.openUrl = this.openUrl.bind( this );
		this.clearErrors = this.clearErrors.bind( this );
		this.fetchNotifications = this.fetchNotifications.bind( this );
		this.writeToken = this.writeToken.bind( this );
		this.markAllNotesSeen = this.markAllNotesSeen.bind( this );
		this.getSecondsUntilNextFetch = this.getSecondsUntilNextFetch.bind( this );
	}

	markAllNotesSeen() {
		const notes = this.state.notes.map( note => {
			note.gitnewsSeen = true;
			return note;
		} );
		debug( 'marking all notes as seen', notes );
		this.setState( { notes } );
	}

	writeToken( token ) {
		setToken( token );
		this.clearErrors();
		this.setState( { token } );
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
			this.setState( { offline: true, lastChecked: Date.now(), fetchInterval: secsToMs( 30 ) } );
			return;
		}
		debug( 'fetching notifications' );
		this.props.getNotifications( token || this.state.token )
			.then( notes => {
				debug( 'notifications retrieved', notes );
				debug( 'previous notifications', this.state.notes );
				const mergedNotes = mergeNotifications( this.state.notes, notes );
				debug( 'merged notifications', mergedNotes );
				this.setState( { notes: mergedNotes, offline: false, lastChecked: Date.now(), lastSuccessfulCheck: Date.now(), fetchInterval: defaultFetchInterval } );
			} )
			.catch( err => {
				debug( 'fetching notifications failed with the error', err );
				if ( err.code === 'GitHubTokenNotFound' ) {
					return; // This is handled in render
				}
				if ( err.code === 'ENOTFOUND' ) {
					debug( 'notifications check failed because we are offline' );
					this.setState( { offline: true, lastChecked: Date.now(), fetchInterval: secsToMs( 30 ) } );
					return;
				}
				if ( err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED' ) {
					debug( 'notifications check failed because of a timeout' );
					this.setState( { offline: true, lastChecked: Date.now(), fetchInterval: secsToMs( 30 ) } );
					return;
				}
				const errorString = 'Error fetching notifications: ' + err;
				console.error( errorString );
				this.setState( { errors: [ ...this.state.errors, errorString ], lastChecked: Date.now() } );
			} );
	}

	clearErrors() {
		debug( 'clearing errors' );
		this.setState( { errors: [] } );
	}

	openUrl( url ) {
		shell.openExternal( url );
	}

	markRead( readNote ) {
		const notes = this.state.notes.map( note => {
			if ( getNoteId( note ) === getNoteId( readNote ) ) {
				note.unread = false;
			}
			return note;
		} );
		this.setState( { notes } );
	}

	showConfig() {
		this.setState( { currentPane: PANE_CONFIG } );
	}

	hideConfig() {
		this.setState( { currentPane: PANE_NOTIFICATIONS } );
	}

	showEditToken() {
		this.setState( { currentPane: PANE_TOKEN } );
	}

	hideEditToken() {
		this.setState( { currentPane: PANE_CONFIG } );
	}

	getActions() {
		const { hideEditToken, showEditToken, hideConfig, showConfig, markRead, openUrl, clearErrors, fetchNotifications, writeToken, markAllNotesSeen, getSecondsUntilNextFetch } = this;
		return { hideEditToken, showEditToken, hideConfig, showConfig, markRead, openUrl, clearErrors, fetchNotifications, writeToken, markAllNotesSeen, getSecondsUntilNextFetch };
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
