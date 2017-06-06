/* globals window */
const React = require( 'react' );
const el = React.createElement;
const { ipcRenderer } = require( 'electron' );
const debugFactory = require( 'debug' );
const debug = debugFactory( 'gitnews-menubar' );
const Header = require( '../components/header' );
const ErrorsArea = require( '../components/errors-area' );
const MainPane = require( '../components/main-pane' );
const { PANE_CONFIG, PANE_NOTIFICATIONS } = require( '../lib/constants' );
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

	getNextIcon( { offline, errors, unseenNotes } ) {
		if ( offline || errors.length ) {
			return 'error';
		}
		if ( unseenNotes.length ) {
			return 'unseen';
		}
		return 'normal';
	}

	render() {
		const { offline, errors, currentPane, token, lastSuccessfulCheck, version } = this.props;
		const { openUrl, clearErrors, hideConfig, showConfig, writeToken, markRead, showEditToken, hideEditToken, quitApp, getSecondsUntilNextFetch } = this.props;
		// We have to have a closure because otherwise it will treat the event param as a token.
		const fetchNotifications = () => {
			debug( 'fetchNotifications called manually' );
			this.props.fetchNotifications();
		};
		const newNotes = this.getUnreadNotifications();
		const readNotes = this.getReadNotifications();
		const unseenNotes = this.getUnseenNotifications();
		const nextIcon = this.getNextIcon( { offline, errors, unseenNotes } );

		debug( 'sending set-icon', nextIcon );
		ipcRenderer.send( 'set-icon', nextIcon );

		return el( 'main', null,
			el( Header, {
				offline,
				fetchNotifications,
				openUrl,
				lastSuccessfulCheck,
				showConfig: currentPane === PANE_NOTIFICATIONS && showConfig,
				hideConfig: currentPane === PANE_CONFIG && hideConfig,
				getSecondsUntilNextFetch,
			} ),
			el( ErrorsArea, { errors, clearErrors } ),
			el( MainPane, {
				token,
				currentPane,
				openUrl,
				writeToken,
				quitApp,
				hideEditToken,
				showEditToken,
				lastSuccessfulCheck,
				version,
				newNotes,
				readNotes,
				markRead,
			} )
		);
	}
}

module.exports = App;
