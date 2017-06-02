/* globals window */
const React = require( 'react' );
const el = React.createElement;
const { ipcRenderer } = require( 'electron' );
const debugFactory = require( 'debug' );
const debug = debugFactory( 'gitnews-menubar' );
const CSSTransitionGroup = require( 'react-transition-group/CSSTransitionGroup' );
const ConfigPage = require( '../components/config-page' );
const UncheckedNotice = require( '../components/unchecked-notice' );
const Header = require( '../components/header' );
const ErrorsArea = require( '../components/errors-area' );
const AddTokenForm = require( '../components/add-token-form' );
const NotificationsArea = require( '../components/notifications-area' );
const { PANE_CONFIG, PANE_TOKEN, PANE_NOTIFICATIONS } = require( '../lib/constants' );
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
		// These are actions
		const { openUrl, clearErrors, hideConfig, showConfig, writeToken, markRead, showEditToken, hideEditToken, quitApp, getSecondsUntilNextFetch } = this.props;
		// We have to have a closure because otherwise it will treat the event param as a token.
		const fetchNotifications = () => this.props.fetchNotifications();

		const newNotes = this.getUnreadNotifications();
		const readNotes = this.getReadNotifications();
		const unseenNotes = this.getUnseenNotifications();

		ipcRenderer.send( 'unread-notifications-count', errors.length || unseenNotes.length );

		return el( 'main', null,
			el( Header,
				{
					offline,
					fetchNotifications,
					openUrl,
					lastSuccessfulCheck: currentPane === PANE_NOTIFICATIONS && lastSuccessfulCheck,
					showConfig,
					quitApp,
					getSecondsUntilNextFetch
				} ),
			el( ErrorsArea, { errors, clearErrors } ),
			el( CSSTransitionGroup, {
				// TODO: I need CSS for this
				transitionName: 'pane',
				transitionAppear: true,
				transitionEnter: true,
				transitionLeave: true,
				transitionAppearTimeout: 800,
				transitionEnterTimeout: 800,
				transitionLeaveTimeout: 800,
			},
				// TODO: these each need keys
				! token && el( AddTokenForm, { token, openUrl, writeToken, hideEditToken } ),
				currentPane === PANE_TOKEN && el( AddTokenForm, { token, openUrl, writeToken, hideEditToken, showCancel: true } ),
				currentPane === PANE_CONFIG && el( ConfigPage, { openUrl, hideConfig, showEditToken, version } ),
				lastSuccessfulCheck || el( UncheckedNotice ),
				// TODO: for some reason the NotificationsArea is invisible; possibly because of scrolling/position styles?
				currentPane === PANE_NOTIFICATIONS && el( NotificationsArea, { newNotes, readNotes, markRead, openUrl } )
			)
		);
	}
}

module.exports = App;
