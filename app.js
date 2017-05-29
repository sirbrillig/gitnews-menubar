/* globals window */
require( 'dotenv' ).config();
const { shell, ipcRenderer } = require( 'electron' );
const { getNotifications } = require( 'gitnews' );
const React = require( 'react' );
const ReactDOM = require( 'react-dom' );
const el = React.createElement;
const debugFactory = require( 'debug' );
const debug = debugFactory( 'gitnews-menubar' );
const unhandled = require( 'electron-unhandled' );
const { getNoteId, getToken, setToken, mergeNotifications } = require( './lib/helpers' );
const ConfigPage = require( './components/config-page' );
const UncheckedNotice = require( './components/unchecked-notice' );
const Header = require( './components/header' );
const ErrorsArea = require( './components/errors-area' );
const AddTokenForm = require( './components/add-token-form' );
const NotificationsArea = require( './components/notifications-area' );

// Catch unhandled Promise rejections
unhandled();

const PANE_NOTIFICATIONS = 'notifications-pane';
const PANE_CONFIG = 'config-pane';
const PANE_TOKEN = 'token-pane';

class App extends React.Component {
	constructor( props ) {
		super( props );
		this.state = {
			token: getToken(),
			notes: [],
			errors: [],
			lastChecked: false,
			offline: false,
			currentPane: PANE_NOTIFICATIONS,
		};

		this.fetchInterval = 120000; // 2 minutes in ms
		this.fetcher = null; // The fetch interval object

		this.fetchNotifications = this.fetchNotifications.bind( this );
		this.markRead = this.markRead.bind( this );
		this.openUrl = this.openUrl.bind( this );
		this.writeToken = this.writeToken.bind( this );
		this.clearErrors = this.clearErrors.bind( this );
		this.showConfig = this.showConfig.bind( this );
		this.hideConfig = this.hideConfig.bind( this );
		this.showEditToken = this.showEditToken.bind( this );
		this.hideEditToken = this.hideEditToken.bind( this );
		this.markAllNotesSeen = this.markAllNotesSeen.bind( this );
	}

	componentDidMount() {
		this.fetchNotifications();
		if ( this.fetcher ) {
			window.clearInterval( this.fetcher );
		}
		this.fetcher = window.setInterval( () => this.fetchNotifications(), this.fetchInterval );
		ipcRenderer.on( 'menubar-click', this.markAllNotesSeen );
	}

	componentWillUnmount() {
		if ( this.fetcher ) {
			window.clearInterval( this.fetcher );
		}
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

	fetchNotifications( token = null ) {
		if ( ! window.navigator.onLine ) {
			debug( 'skipping notifications check because we are offline' );
			this.setState( { offline: true } );
			return;
		}
		debug( 'fetching notifications' );
		this.props.getNotifications( token || this.state.token )
			.then( notes => {
				debug( 'notifications retrieved', notes );
				debug( 'previous notifications', this.state.notes );
				const mergedNotes = mergeNotifications( this.state.notes, notes );
				debug( 'merged notifications', mergedNotes );
				this.setState( { notes: mergedNotes, offline: false, lastChecked: Date.now() } );
			} )
			.catch( err => {
				debug( 'fetching notifications failed with the error', err );
				if ( err.code === 'GitHubTokenNotFound' ) {
					return; // This is handled in render
				}
				if ( err.code === 'ENOTFOUND' ) {
					debug( 'notifications check failed because we are offline' );
					this.setState( { offline: true } );
					return;
				}
				if ( err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED' ) {
					debug( 'notifications check failed because of a timeout' );
					this.setState( { offline: true } );
					return;
				}
				const errorString = 'Error fetching notifications: ' + err;
				console.error( errorString );
				this.setState( { errors: [ ...this.state.errors, errorString ] } );
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

	getReadNotifications() {
		return this.state.notes.filter( note => ! note.unread );
	}

	getUnreadNotifications() {
		return this.state.notes.filter( note => note.unread );
	}

	getUnseenNotifications() {
		return this.getUnreadNotifications().filter( note => ! note.gitnewsSeen );
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

	render() {
		const { offline, errors, currentPane, token, lastChecked } = this.state;
		const { openUrl, clearErrors, hideConfig, showConfig, writeToken, markRead, showEditToken, hideEditToken } = this;
		// We have to have a closure because otherwise it will treat the event param as a token.
		const fetchNotifications = () => this.fetchNotifications();
		if ( ! token || currentPane === PANE_TOKEN ) {
			return el( 'main', null,
				el( Header, { offline, fetchNotifications, openUrl } ),
				el( ErrorsArea, { errors, clearErrors } ),
				el( AddTokenForm, { token, openUrl, writeToken, hideEditToken, showCancel: currentPane === PANE_TOKEN } )
			);
		}
		if ( currentPane === PANE_CONFIG ) {
			return el( 'main', null,
				el( Header, { offline, fetchNotifications, openUrl } ),
				el( ConfigPage, { openUrl, hideConfig, showEditToken } )
			);
		}
		if ( ! lastChecked ) {
			return el( 'main', null,
				el( Header, { offline, fetchNotifications, openUrl } ),
				el( ErrorsArea, { errors, clearErrors } ),
				el( UncheckedNotice )
			);
		}
		const newNotes = this.getUnreadNotifications();
		const readNotes = this.getReadNotifications();
		const unseenNotes = this.getUnseenNotifications();
		ipcRenderer.send( 'unread-notifications-count', unseenNotes.length );
		return el( 'main', null,
			el( Header, { offline, fetchNotifications, openUrl, lastChecked, showConfig } ),
			el( ErrorsArea, { errors, clearErrors } ),
			el( NotificationsArea, { newNotes, readNotes, markRead, openUrl } )
		);
	}
}

function runApp() {
	const main = window.document.querySelector( '.main' );
	if ( ! main ) {
		console.error( 'Could not find main element' );
		return;
	}
	ReactDOM.render( el( App, { getNotifications } ), main );
}

runApp();
