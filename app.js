/* globals window */
require( 'dotenv' ).config();
const { shell, ipcRenderer } = require( 'electron' );
const { getNotifications } = require( 'gitnews' );
const Conf = require( 'conf' );
const config = new Conf();
const React = require( 'react' );
const ReactDOM = require( 'react-dom' );
const el = React.createElement;

function getToken() {
	return process.env.GITNEWS_TOKEN || config.get( 'gitnews-token' );
}

function Notification( { note, fetchNotifications } ) {
	const onClick = () => {
		fetchNotifications();
		shell.openExternal( note.html_url );
	};
	return el( 'div', { className: 'notification', onClick }, [
		el( 'span', { className: 'notification__repo', key: 'notification__repo' }, note.repository.full_name ),
		': ',
		el( 'span', { className: 'notification__title', key: 'notification__title' }, note.subject.title ),
	] );
}

function NotificationsArea( { notes, fetchNotifications } ) {
	const content = notes.length ? notes.map( note => el( Notification, { note, key: note.id, fetchNotifications } ) ) : 'No Notifications!';
	return el( 'div', { className: 'notifications-area' }, content );
}

class App extends React.Component {
	constructor( props ) {
		super( props );
		this.fetchInterval = 600000; // 10 minutes in ms
		this.fetcher = null; // The fetch interval object
		this.state = { notes: [] };
		this.fetchNotifications = this.fetchNotifications.bind( this );
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
		this.props.getNotifications( getToken() )
			.then( notes => {
				this.setState( { notes } );
			} )
			.catch( function( err ) {
				console.error( err );
			} );
	}

	render() {
		ipcRenderer.send( 'unread-notifications-count', this.state.notes.length );
		return el( NotificationsArea, { notes: this.state.notes, fetchNotifications: this.fetchNotifications } );
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
