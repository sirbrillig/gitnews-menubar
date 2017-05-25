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
const Gridicon = require( 'gridicons' );

// Catch unhandled Promise rejections
unhandled();

const PANE_NOTIFICATIONS = 'notifications-pane';
const PANE_CONFIG = 'config-pane';
const PANE_TOKEN = 'token-pane';

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
	return el( Gridicon, { icon: 'checkmark-circle', size: 36, className: 'no-notifications-icon' } );
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
		el( 'div', { className: 'notifications-area__inner' },
			noteRows,
			readNoteRows
		)
	);
}

function Attributions( { openUrl } ) {
	const openLink = ( event ) => {
		event.preventDefault();
		openUrl( event.target.href );
	};
	return el( 'div', { className: 'attributions' },
		el( 'h3', null, 'Attribution' ),
		'Icons made by ',
		el( 'a', { onClick: openLink, href: 'http://www.flaticon.com/authors/daniel-bruce', title: 'Daniel Bruce' }, 'Daniel Bruce' ),
		' and ',
		el( 'a', { onClick: openLink, href: 'http://www.flaticon.com/authors/gregor-cresnar', title: 'Gregor Cresnar' }, 'Gregor Cresnar' ),
		' from ',
		el( 'a', { onClick: openLink, href: 'http://www.flaticon.com', title: 'Flaticon' }, 'Flaticon' ),
		' (',
		el( 'a', { onClick: openLink, href: 'http://creativecommons.org/licenses/by/3.0/', title: 'Creative Commons BY 3.0' }, 'CC 3 BY' ),
		') '
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

function AddTokenForm( { openUrl, writeToken, hideEditToken } ) {
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
		el( 'label', { htmlFor: 'add-token-form__input' }, 'GitHub Token:' ),
		el( 'input', { type: 'password', className: 'add-token-form__input', id: 'add-token-form__input', ref: saveTokenField } ),
		el( 'button', { className: 'add-token-form__save-button btn', onClick: saveToken }, 'Save Token' ),
		hideEditToken && el( 'a', { href: '#', onClick: hideEditToken }, 'Cancel' )
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
			el( 'a', { className: 'quit-button', onClick: quit, href: '#', title: 'Quit' }, el( Gridicon, { icon: 'cross-small' } ) ),
			el( Logo, { onClick: openLink } ),
			showConfig ? el( 'a', { className: 'config-button', onClick: showConfig, href: '#', title: 'Configuration' }, el( Gridicon, { icon: 'cog' } ) ) : el( 'span', { className: 'config-spacer' } )
		),
		el( 'div', { className: 'header__secondary' },
			lastChecked && el( LastChecked, { lastChecked } )
		),
		offline && el( OfflineNotice, { fetchNotifications } )
	);
}

function ConfigPage( { showEditToken, hideConfig, openUrl } ) {
	return el( 'div', { className: 'config-page' },
		el( 'h2', { className: 'config-page__title' }, 'Configuration' ),
		el( 'a', { href: '#', onClick: hideConfig }, '< Back' ),
		el( 'h3', null, 'Token' ),
		el( 'div', null, 'Would you like to change your authentication token?' ),
		el( 'a', { href: '#', onClick: showEditToken }, 'Edit token' ),
		el( Attributions, { openUrl } )
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
				this.setState( { notes, offline: false, lastChecked: Date.now() } );
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
				el( AddTokenForm, { openUrl, writeToken, hideEditToken: currentPane === PANE_TOKEN && hideEditToken } )
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
		ipcRenderer.send( 'unread-notifications-count', newNotes.length );
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
