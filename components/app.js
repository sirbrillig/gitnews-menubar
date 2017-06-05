/* globals window */
const React = require( 'react' );
const el = React.createElement;
const { ipcRenderer } = require( 'electron' );
const debugFactory = require( 'debug' );
const debug = debugFactory( 'gitnews-menubar' );
const ConfigPage = require( '../components/config-page' );
const UncheckedNotice = require( '../components/unchecked-notice' );
const Header = require( '../components/header' );
const ErrorsArea = require( '../components/errors-area' );
const AddTokenForm = require( '../components/add-token-form' );
const NotificationsArea = require( '../components/notifications-area' );
const { PANE_CONFIG, PANE_TOKEN } = require( '../lib/constants' );
const { secsToMs } = require( '../lib/helpers' );

class App extends React.Component {
	constructor( props ) {
		super( props );
		this.refreshInterval = secsToMs( 1 );
		this.fetcher = null; // The fetch interval object
	}

	componentDidMount() {
		debug( 'App mounted' );
		this.props.fetchNotifications();
		if ( this.fetcher ) {
			window.clearInterval( this.fetcher );
		}
		this.fetcher = window.setInterval( () => {
			if ( this.props.getSecondsUntilNextFetch() < 1 ) {
				debug( 'fetch interval reached' );
				this.props.fetchNotifications();
			}
		}, this.refreshInterval );
		ipcRenderer.on( 'menubar-click', this.props.markAllNotesSeen );
	}

	componentWillUnmount() {
		if ( this.fetcher ) {
			window.clearInterval( this.fetcher );
		}
	}

	getReadNotifications() {
		return this.props.notes.filter( note => ! note.unread );
	}

	getUnreadNotifications() {
		return this.props.notes.filter( note => note.unread );
	}

	getUnseenNotifications() {
		return this.getUnreadNotifications().filter( note => ! note.gitnewsSeen );
	}

	render() {
		const { offline, errors, currentPane, token, lastSuccessfulCheck, version } = this.props;
		const { openUrl, clearErrors, hideConfig, showConfig, writeToken, markRead, showEditToken, hideEditToken, quitApp, getSecondsUntilNextFetch } = this.props;
		// We have to have a closure because otherwise it will treat the event param as a token.
		const fetchNotifications = () => {
			debug( 'fetchNotifications called manually' );
			this.props.fetchNotifications();
		};
		if ( ! token || currentPane === PANE_TOKEN ) {
			return el( 'main', null,
				el( Header, { offline, fetchNotifications, openUrl, getSecondsUntilNextFetch } ),
				el( ErrorsArea, { errors, clearErrors } ),
				el( AddTokenForm, { token, openUrl, writeToken, hideEditToken, showCancel: currentPane === PANE_TOKEN } )
			);
		}
		if ( currentPane === PANE_CONFIG ) {
			return el( 'main', null,
				el( Header, { offline, fetchNotifications, openUrl, getSecondsUntilNextFetch, hideConfig } ),
				el( ConfigPage, { openUrl, showEditToken, version, quitApp } )
			);
		}
		if ( ! lastSuccessfulCheck ) {
			const unseenCountForIcon = offline ? 1 : errors.length;
			debug( 'sending unseenCountForIcon', unseenCountForIcon );
			ipcRenderer.send( 'unread-notifications-count', unseenCountForIcon );
			return el( 'main', null,
				el( Header, { offline, fetchNotifications, openUrl, getSecondsUntilNextFetch, showConfig } ),
				el( ErrorsArea, { errors, clearErrors } ),
				el( UncheckedNotice )
			);
		}
		const newNotes = this.getUnreadNotifications();
		const readNotes = this.getReadNotifications();
		const unseenNotes = this.getUnseenNotifications();
		const unseenCountForIcon = offline ? 1 : ( errors.length || unseenNotes.length );
		debug( 'sending unseenCountForIcon', unseenCountForIcon );
		ipcRenderer.send( 'unread-notifications-count', unseenCountForIcon );
		return el( 'main', null,
			el( Header, { offline, fetchNotifications, openUrl, lastSuccessfulCheck, showConfig, getSecondsUntilNextFetch } ),
			el( ErrorsArea, { errors, clearErrors } ),
			el( NotificationsArea, { newNotes, readNotes, markRead, openUrl } )
		);
	}
}

module.exports = App;
