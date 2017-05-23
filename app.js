/* globals window */
require( 'dotenv' ).config();
const { shell, ipcRenderer, remote } = require( 'electron' );
const { getNotifications } = require( 'gitnews' );
const Conf = require( 'conf' );
const config = new Conf();
const React = require( 'react' );
const ReactDOM = require( 'react-dom' );
const el = React.createElement;
const date = require( 'date-fns' );
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
	const timeString = date.distanceInWords( Date.now(), date.parse( note.updated_at ), { addSuffix: true } );
	const noteClass = note.unread ? ' notification__unread' : ' notification__read';
	return el( 'div', { className: 'notification' + noteClass, onClick },
		el( 'div', { className: 'notification__image' }, el( 'img', { src: note.repository.owner.avatar_url } ) ),
		el( 'div', { className: 'notification__body' },
			el( 'div', { className: 'notification__repo' }, note.repository.full_name ),
			el( 'div', { className: 'notification__title' }, note.subject.title ),
			el( 'div', { className: 'notification__time' }, timeString )
		)
	);
}

function NoNotificationsIcon() {
	return el( 'img', { className: 'no-notifications-icon', src: 'no-notifications.svg' } );
}

function NoNotifications() {
	return el( 'div', { className: 'no-notifications' },
		el( 'div', null,
			el( NoNotificationsIcon ),
			'No new notifications!'
		)
	);
}

function NotificationsArea( { newNotes, readNotes, markRead, openUrl } ) {
	const noteRows = newNotes.length ? newNotes.map( note => el( Notification, { note, key: note.id, markRead, openUrl } ) ) : el( NoNotifications );
	const readNoteRows = readNotes.map( note => el( Notification, { note, key: note.id, markRead, openUrl } ) );
	return el( 'div', { className: 'notifications-area' },
		noteRows,
		readNoteRows
	);
}

function Footer( { openUrl } ) {
	const openLink = ( event ) => {
		event.preventDefault();
		openUrl( event.target.href );
	};
	return el( 'footer', null,
		el( 'span', { className: 'footer__attribution' },
			'Icons made by ',
			el( 'a', { onClick: openLink, href: 'http://www.flaticon.com/authors/daniel-bruce', title: 'Daniel Bruce' }, 'Daniel Bruce' ),
			' and ',
			el( 'a', { onClick: openLink, href: 'http://www.flaticon.com/authors/gregor-cresnar', title: 'Gregor Cresnar' }, 'Gregor Cresnar' ),
			' from ',
			el( 'a', { onClick: openLink, href: 'http://www.flaticon.com', title: 'Flaticon' }, 'Flaticon' ),
			' (',
			el( 'a', { onClick: openLink, href: 'http://creativecommons.org/licenses/by/3.0/', title: 'Creative Commons BY 3.0' }, 'CC 3 BY' ),
			') '
		)
	);
}

function ClearErrorsButton( { clearErrors } ) {
	return el( 'button', { className: 'clear-errors-button btn', onClick: clearErrors }, 'Clear Errors' );
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
	return el( 'div', { className: 'add-token-form' },
		el( 'p', null,
			'You must generate a GitHub authentication token so this app can see your notifications. It will need the `notifications` and `repo` scopes. You can generate a token ',
			el( 'a', { href: 'https://github.com/settings/tokens', onClick: openLink }, 'here.' )
		),
		el( 'label', { htmlFor: 'add-token-form__input' }, 'Token:' ),
		el( 'input', { type: 'password', className: 'add-token-form__input', id: 'add-token-form__input', ref: saveTokenField } ),
		el( 'button', { className: 'add-token-form__save-button btn', onClick: saveToken }, 'Save Token' )
	);
}

class LastChecked extends React.Component {
	constructor( props ) {
		super( props );
		this.lastCheckedUpdater = null;
		this.updateInterval = 30000; // 30 seconds in ms
		this.updateTimestamp = this.updateTimestamp.bind( this );
		this.state = { lastUpdated: 0 };
	}

	componentDidMount() {
		if ( this.lastCheckedUpdater ) {
			window.clearInterval( this.lastCheckedUpdater );
		}
		this.lastCheckedUpdater = window.setInterval( () => this.updateTimestamp(), this.updateInterval );
	}

	componentWillUnmount() {
		if ( this.lastCheckedUpdater ) {
			window.clearInterval( this.lastCheckedUpdater );
		}
	}

	updateTimestamp() {
		debug( 'updating LastChecked timestamp', this.state );
		// Just a hack to force re-rendering
		this.setState( { lastUpdated: Date.now() } );
	}

	render() {
		const lastChecked = this.props.lastChecked;
		if ( ! lastChecked ) {
			return null;
		}
		const lastCheckedString = date.distanceInWords( Date.now(), date.parse( lastChecked ), { addSuffix: true } );
		debug( 'updating LastChecked display for', lastChecked, lastCheckedString );
		return el( 'div', { className: 'last-checked' },
			'last checked: ' + lastCheckedString
		);
	}
}

function Logo( { onClick } ) {
	return el( 'h1', null,
		el( 'a', { href: 'https://github.com/sirbrillig/gitnews-menubar', onClick },
			'Gitnews'
		)
	);
}

function Header( { openUrl, lastChecked, showConfig, offline, fetchNotifications } ) {
	const openLink = ( event ) => {
		event.preventDefault();
		openUrl( event.target.href );
	};
	const quit = () => remote.app.quit();
	return el( 'header', null,
		el( 'div', { className: 'header__primary' },
			el( Logo, { onClick: openLink } ),
			el( 'div', { className: 'header__buttons' },
				showConfig && el( 'button', { className: 'btn', onClick: showConfig }, 'Config' ),
				el( 'button', { className: 'btn', onClick: quit }, 'Quit' )
			)
		),
		el( 'div', { className: 'header__secondary' },
			lastChecked && el( LastChecked, { lastChecked } )
		),
		offline && el( OfflineNotice, { fetchNotifications } )
	);
}

function ConfigPage( { clearAuth, hideConfig } ) {
	return el( 'div', { className: 'config-page' },
		el( 'p', null, 'Would you like to change your authentication token?' ),
		el( 'button', { className: 'btn', onClick: clearAuth }, 'Change token' ),
		el( 'a', { href: '#', onClick: hideConfig }, 'Cancel' )
	);
}

function UncheckedNotice() {
	return el( 'div', { className: 'unchecked-notice' },
		el( 'h2', null, 'Checking for notifications...' )
	);
}

function OfflineNotice( { fetchNotifications } ) {
	return el( 'div', { className: 'offline-notice' },
		el( 'span', null, 'I\'m having trouble connecting. Retrying shortly. ' ),
		el( 'a', { href: '#', onClick: fetchNotifications }, 'Retry now' )
	);
}

class App extends React.Component {
	constructor( props ) {
		super( props );
		this.state = {
			token: getToken(),
			notes: [],
			errors: [],
			lastChecked: false,
			showingConfig: false,
			offline: false,
		};

		this.fetchInterval = 120000; // 2 minutes in ms
		this.fetcher = null; // The fetch interval object

		this.fetchNotifications = this.fetchNotifications.bind( this );
		this.markRead = this.markRead.bind( this );
		this.openUrl = this.openUrl.bind( this );
		this.writeToken = this.writeToken.bind( this );
		this.clearAuth = this.clearAuth.bind( this );
		this.clearErrors = this.clearErrors.bind( this );
		this.showConfig = this.showConfig.bind( this );
		this.hideConfig = this.hideConfig.bind( this );
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
		if ( ! window.navigator.onLine ) {
			debug( 'skipping notifications check because we are offline' );
			this.setState( { offline: true } );
			return;
		}
		debug( 'fetching notifications' );
		this.props.getNotifications( token || this.state.token, { all: true } )
			.then( notes => {
				debug( 'notifications retrieved', notes );
				this.setState( { notes, lastChecked: Date.now() } );
			} )
			.catch( err => {
				debug( 'fetching notifications failed with the error', err );
				if ( err === 'GitHub token is not available' ) {
					return; // This is handled in render
				}
				if ( err.code === 'ENOTFOUND' ) {
					debug( 'notifications check failed because we are offline' );
					this.setState( { offline: true } );
					return;
				}
				if ( err.code === 'ETIMEDOUT' ) {
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

	showConfig() {
		this.setState( { showingConfig: true } );
	}

	hideConfig() {
		this.setState( { showingConfig: false } );
	}

	render() {
		const { offline } = this.state;
		// We have to have a closure because otherwise it will treat the event param as a token.
		const fetchNotifications = () => this.fetchNotifications();
		if ( ! this.state.token ) {
			return el( 'main', null,
				el( Header, { offline, fetchNotifications, openUrl: this.openUrl } ),
				el( ErrorsArea, { errors: this.state.errors, clearErrors: this.clearErrors } ),
				el( AddTokenForm, { openUrl: this.openUrl, writeToken: this.writeToken } ),
				el( Footer, { openUrl: this.openUrl } )
			);
		}
		if ( this.state.showingConfig ) {
			return el( 'main', null,
				el( Header, { offline, fetchNotifications, openUrl: this.openUrl } ),
				el( ConfigPage, { hideConfig: this.hideConfig, clearAuth: this.clearAuth } ),
				el( Footer, { openUrl: this.openUrl } )
			);
		}
		if ( ! this.state.lastChecked ) {
			return el( 'main', null,
				el( Header, { offline, fetchNotifications, openUrl: this.openUrl } ),
				el( ErrorsArea, { errors: this.state.errors, clearErrors: this.clearErrors } ),
				el( UncheckedNotice ),
				el( Footer, { openUrl: this.openUrl } )
			);
		}
		const newNotes = this.getUnreadNotifications();
		const readNotes = this.getReadNotifications();
		ipcRenderer.send( 'unread-notifications-count', newNotes.length );
		return el( 'main', null,
			el( Header, { offline, fetchNotifications, openUrl: this.openUrl, lastChecked: this.state.lastChecked, showConfig: this.showConfig } ),
			el( ErrorsArea, { errors: this.state.errors, clearErrors: this.clearErrors } ),
			el( NotificationsArea, { newNotes, readNotes, markRead: this.markRead, openUrl: this.openUrl } ),
			el( Footer, { openUrl: this.openUrl } )
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
