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

function getToken() {
	return process.env.GITNEWS_TOKEN || config.get( 'gitnews-token' );
}

function Notification( { note, openUrl, markRead } ) {
	const onClick = () => {
		debug( 'clicked on notification', note );
		markRead( note );
		openUrl( note.html_url );
	};
	return el( 'div', { className: 'notification', onClick }, [
		el( 'span', { className: 'notification__repo', key: 'notification__repo' }, note.repository.full_name ),
		': ',
		el( 'span', { className: 'notification__title', key: 'notification__title' }, note.subject.title ),
	] );
}

function NoNotificationsIcon() {
	return el( 'img', { className: 'no-notifications', src: 'no-notifications.svg' } );
}

function NoNotifications() {
	return el( 'div', null, [
		el( NoNotificationsIcon ),
		'No Notifications!',
	] );
}

function NotificationsArea( { notes, markRead, openUrl } ) {
	const content = notes.length ? notes.map( note => el( Notification, { note, key: note.id, markRead, openUrl } ) ) : el( NoNotifications );
	return el( 'div', { className: 'notifications-area' }, content );
}

function Footer( { openUrl } ) {
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
		el( 'button', { className: 'footer__quit', onClick: quit }, 'Quit' ),
	] );
}

class App extends React.Component {
	constructor( props ) {
		super( props );
		this.fetchInterval = 300000; // 5 minutes in ms
		this.fetcher = null; // The fetch interval object
		this.state = { notes: [] };
		this.fetchNotifications = this.fetchNotifications.bind( this );
		this.markRead = this.markRead.bind( this );
		this.openUrl = this.openUrl.bind( this );
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

	fetchNotifications() {
		debug( 'fetching notifications' );
		this.props.getNotifications( getToken() )
			.then( notes => {
				debug( 'notifications retrieved', notes );
				this.setState( { notes } );
			} )
			.catch( function( err ) {
				console.error( err );
			} );
	}

	openUrl( url ) {
		shell.openExternal( url );
	}

	markRead( readNote ) {
		this.setState( { notes: this.state.notes.filter( note => note.id === readNote.id ).map( note => note.unread = false ) } );
	}

	getUnreadNotifications() {
		return this.state.notes.filter( note => note.unread );
	}

	render() {
		const notes = this.getUnreadNotifications();
		ipcRenderer.send( 'unread-notifications-count', notes.length );
		return el( 'main', null, [
			el( NotificationsArea, { notes, markRead: this.markRead, openUrl: this.openUrl } ),
			el( Footer, { openUrl: this.openUrl } ),
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
