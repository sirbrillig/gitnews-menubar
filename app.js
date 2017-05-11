/* globals window */
require( 'dotenv' ).config();
const { shell, ipcRenderer } = require( 'electron' );
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

function Notification( { note, openNotification, markRead } ) {
	const onClick = () => {
		debug( 'clicked on notification', note );
		markRead( note );
		openNotification( note );
	};
	return el( 'div', { className: 'notification', onClick }, [
		el( 'span', { className: 'notification__repo', key: 'notification__repo' }, note.repository.full_name ),
		': ',
		el( 'span', { className: 'notification__title', key: 'notification__title' }, note.subject.title ),
	] );
}

function NotificationsArea( { notes, markRead, openNotification } ) {
	const content = notes.length ? notes.map( note => el( Notification, { note, key: note.id, markRead, openNotification } ) ) : 'No Notifications!';
	return el( 'div', { className: 'notifications-area' }, content );
}

class App extends React.Component {
	constructor( props ) {
		super( props );
		this.fetchInterval = 300000; // 5 minutes in ms
		this.fetcher = null; // The fetch interval object
		this.state = { notes: [] };
		this.fetchNotifications = this.fetchNotifications.bind( this );
		this.markRead = this.markRead.bind( this );
		this.openNotification = this.openNotification.bind( this );
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

	openNotification( note ) {
		shell.openExternal( note.html_url );
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
		return el( NotificationsArea, { notes, markRead: this.markRead, openNotification: this.openNotification } );
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
