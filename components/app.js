/* globals window */
const React = require( 'react' );
const el = React.createElement;
const { ipcRenderer } = require( 'electron' );
const ConfigPage = require( '../components/config-page' );
const UncheckedNotice = require( '../components/unchecked-notice' );
const Header = require( '../components/header' );
const ErrorsArea = require( '../components/errors-area' );
const AddTokenForm = require( '../components/add-token-form' );
const NotificationsArea = require( '../components/notifications-area' );
const { PANE_CONFIG, PANE_TOKEN } = require( '../lib/constants' );

class App extends React.Component {
	constructor( props ) {
		super( props );
		this.fetchInterval = 120000; // 2 minutes in ms
		this.fetcher = null; // The fetch interval object
	}

	componentDidMount() {
		this.props.fetchNotifications();
		if ( this.fetcher ) {
			window.clearInterval( this.fetcher );
		}
		this.fetcher = window.setInterval( () => this.props.fetchNotifications(), this.fetchInterval );
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
		const { offline, errors, currentPane, token, lastChecked } = this.props;
		const { openUrl, clearErrors, hideConfig, showConfig, writeToken, markRead, showEditToken, hideEditToken, quitApp } = this.props;
		// We have to have a closure because otherwise it will treat the event param as a token.
		const fetchNotifications = () => this.fetchNotifications();
		if ( ! token || currentPane === PANE_TOKEN ) {
			return el( 'main', null,
				el( Header, { offline, fetchNotifications, openUrl, quitApp } ),
				el( ErrorsArea, { errors, clearErrors } ),
				el( AddTokenForm, { token, openUrl, writeToken, hideEditToken, showCancel: currentPane === PANE_TOKEN } )
			);
		}
		if ( currentPane === PANE_CONFIG ) {
			return el( 'main', null,
				el( Header, { offline, fetchNotifications, openUrl, quitApp } ),
				el( ConfigPage, { openUrl, hideConfig, showEditToken } )
			);
		}
		if ( ! lastChecked ) {
			return el( 'main', null,
				el( Header, { offline, fetchNotifications, openUrl, quitApp } ),
				el( ErrorsArea, { errors, clearErrors } ),
				el( UncheckedNotice )
			);
		}
		const newNotes = this.getUnreadNotifications();
		const readNotes = this.getReadNotifications();
		const unseenNotes = this.getUnseenNotifications();
		ipcRenderer.send( 'unread-notifications-count', unseenNotes.length );
		return el( 'main', null,
			el( Header, { offline, fetchNotifications, openUrl, lastChecked, showConfig, quitApp } ),
			el( ErrorsArea, { errors, clearErrors } ),
			el( NotificationsArea, { newNotes, readNotes, markRead, openUrl } )
		);
	}
}

module.exports = App;
