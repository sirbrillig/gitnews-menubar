/* globals window */
require( 'dotenv' ).config();
const { shell, ipcRenderer, remote } = require( 'electron' );
const { getNotifications } = require( 'gitnews' );
const Conf = require( 'conf' );
const config = new Conf();
const React = require( 'react' );
const ReactDOM = require( 'react-dom' );
const el = React.createElement;
const debugFactory = require( 'debug' );
const debug = debugFactory( 'gitnews-menubar' );
const unhandled = require( 'electron-unhandled' );

// Catch unhandled Promise rejections
unhandled();

function getToken() {
	return config.get( 'gitnews-token' ) || process.env.GITNEWS_TOKEN;
}

function setToken( token ) {
	config.set( 'gitnews-token', token );
}

function Notification( { note, openUrl, markRead } ) {
	const onClick = () => {
		debug( 'clicked on notification', note );
		markRead( note );
		openUrl( note.html_url );
	};
	const noteClass = note.unread ? ' notification__unread' : ' notification__read';
	return el( 'div', { className: 'notification' + noteClass, onClick }, [
		el( 'span', { className: 'notification__repo', key: 'notification__repo' }, note.repository.full_name ),
		': ',
		el( 'span', { className: 'notification__title', key: 'notification__title' }, note.subject.title ),
	] );
}

function NoNotificationsIcon() {
	return el( 'img', { className: 'no-notifications-icon', src: 'no-notifications.svg' } );
}

function NoNotifications() {
	return el( 'div', { className: 'no-notifications' }, [
		el( 'div', null, [
			el( NoNotificationsIcon ),
			'No new notifications!',
		] ),
	] );
}

function NotificationsArea( { newNotes, readNotes, markRead, openUrl } ) {
	const noteRows = newNotes.length ? newNotes.map( note => el( Notification, { note, key: note.id, markRead, openUrl } ) ) : el( NoNotifications );
	const readNoteRows = readNotes.map( note => el( Notification, { note, key: note.id, markRead, openUrl } ) );
	return el( 'div', { className: 'notifications-area' }, [
		noteRows,
		readNoteRows,
	] );
}

function Footer( { openUrl, clearAuth } ) {
	const openLink = ( event ) => {
		event.preventDefault();
		openUrl( event.target.href );
	};
	const quit = () => {
		remote.app.quit();
	};
	return el( 'footer', null, [
		el( 'span', { className: 'footer__attribution' }, [
			'Icons made by ',
			el( 'a', { onClick: openLink, href: 'http://www.flaticon.com/authors/daniel-bruce', title: 'Daniel Bruce' }, 'Daniel Bruce' ),
			' and ',
			el( 'a', { onClick: openLink, href: 'http://www.flaticon.com/authors/gregor-cresnar', title: 'Gregor Cresnar' }, 'Gregor Cresnar' ),
			' from ',
			el( 'a', { onClick: openLink, href: 'http://www.flaticon.com', title: 'Flaticon' }, 'Flaticon' ),
			' (',
			el( 'a', { onClick: openLink, href: 'http://creativecommons.org/licenses/by/3.0/', title: 'Creative Commons BY 3.0' }, 'CC 3 BY' ),
			') ',
		] ),
		el( 'button', { className: 'footer__clear-auth', onClick: clearAuth }, 'Change authentication token' ),
		el( 'button', { className: 'footer__quit', onClick: quit }, 'Quit' ),
	] );
}

function ClearErrorsButton( { clearErrors } ) {
	return el( 'button', { className: 'clear-errors-button', onClick: clearErrors }, 'Clear Errors' );
}

function ErrorMessage( { error } ) {
	return el( 'div', { className: 'error-message' }, error );
}

function ErrorsArea( { errors, clearErrors } ) {
	return el( 'div', { className: 'errors-area' }, [
		errors.length > 0 ? el( ClearErrorsButton, { clearErrors } ) : null,
		errors.map( error => el( ErrorMessage, { error, key: error } ) ),
	] );
}

function AddTokenForm( { openUrl, writeToken } ) {
	const openLink = ( event ) => {
		event.preventDefault();
		openUrl( event.target.href );
	};
	let tokenField = null;
	const saveTokenField = ( field ) => {
		tokenField = field;
	};
	const saveToken = () => {
		if ( tokenField ) {
			writeToken( tokenField.value );
		}
	};
	return el( 'div', { className: 'add-token-form' }, [
		el( 'p', null, [
			'You must generate a GitHub authentication token so this app can see your notifications. It will need the `notifications` and `repo` scopes. You can generate a token ',
			el( 'a', { href: 'https://github.com/settings/tokens', onClick: openLink }, 'here' ),
			'.',
		] ),
		el( 'label', { htmlFor: 'add-token-form__input' }, 'Token:' ),
		el( 'input', { type: 'password', className: 'add-token-form__input', id: 'add-token-form__input', ref: saveTokenField } ),
		el( 'button', { className: 'add-token-form__save-button', onClick: saveToken }, 'Save Token' ),
	] );
}

class App extends React.Component {
	constructor( props ) {
		super( props );
		this.fetchInterval = 300000; // 5 minutes in ms
		this.fetcher = null; // The fetch interval object
		this.state = { token: getToken(), notes: [], errors: [] };
		this.fetchNotifications = this.fetchNotifications.bind( this );
		this.markRead = this.markRead.bind( this );
		this.openUrl = this.openUrl.bind( this );
		this.writeToken = this.writeToken.bind( this );
		this.clearAuth = this.clearAuth.bind( this );
		this.clearErrors = this.clearErrors.bind( this );
	}

	componentDidMount() {
		this.fetchNotifications();
		if ( this.fetcher ) {
			window.clearInterval( this.fetcher );
		}
		this.fetcher = window.setInterval( () => this.fetchNotifications(), this.fetchInterval );
	}

	componentWillUnmount() {
		if ( this.fetcher ) {
			window.clearInterval( this.fetcher );
		}
	}

	writeToken( token ) {
		setToken( token );
		this.clearErrors();
		this.setState( { token } );
		this.fetchNotifications( token );
	}

	fetchNotifications( token = null ) {
		debug( 'fetching notifications' );
		this.props.getNotifications( token || this.state.token, { all: true } )
			.then( notes => {
				debug( 'notifications retrieved', notes );
				this.setState( { notes } );
			} )
			.catch( err => {
				if ( err === 'GitHub token is not available' ) {
					return; // This is handled in render
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

	clearAuth() {
		this.setState( { token: null } );
	}

	openUrl( url ) {
		shell.openExternal( url );
	}

	markRead( readNote ) {
		const notes = this.state.notes.map( note => {
			if ( note.id === readNote.id ) {
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

	render() {
		if ( ! this.state.token ) {
			return el( 'main', null, [
				el( ErrorsArea, { errors: this.state.errors, clearErrors: this.clearErrors } ),
				el( AddTokenForm, { openUrl: this.openUrl, writeToken: this.writeToken } ),
				el( Footer, { openUrl: this.openUrl, clearAuth: this.clearAuth } ),
			] );
		}
		const newNotes = this.getUnreadNotifications();
		const readNotes = this.getReadNotifications();
		ipcRenderer.send( 'unread-notifications-count', newNotes.length );
		return el( 'main', null, [
			el( ErrorsArea, { errors: this.state.errors, clearErrors: this.clearErrors } ),
			el( NotificationsArea, { newNotes, readNotes, markRead: this.markRead, openUrl: this.openUrl } ),
			el( Footer, { openUrl: this.openUrl, clearAuth: this.clearAuth } ),
		] );
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
