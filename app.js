/* globals window */
require( 'dotenv' ).config();
const { getNotifications } = require( 'gitnews' );
const Conf = require( 'conf' );
const config = new Conf();
const React = require( 'react' );
const ReactDOM = require( 'react-dom' );
const el = React.createElement;

function getToken() {
	return process.env.GITNEWS_TOKEN || config.get( 'gitnews-token' );
}

function Notification( { note } ) {
	return el( 'div', { className: 'notification' }, [
		el( 'span', { className: 'notification__repo', key: 'notification__repo' }, note.repository.full_name ),
		': ',
		el( 'span', { className: 'notification__title', key: 'notification__title' }, note.subject.title ),
	] );
}

function NotificationsArea( { notes } ) {
	const content = notes.length ? notes.map( note => el( Notification, { note, key: note.id } ) ) : 'No Notifications!';
	return el( 'div', { className: 'notifications-area' }, content );
}

class App extends React.Component {
	constructor( props ) {
		super( props );
		this.state = { notes: [] };
	}

	componentDidMount() {
		getNotifications( getToken() )
			.then( notes => {
				this.setState( { notes } );
			} )
			.catch( function( err ) {
				console.error( err );
			} );
	}

	render() {
		return el( NotificationsArea, { notes: this.state.notes } );
	}
}

function runApp() {
	const main = window.document.querySelector( '.main' );
	if ( ! main ) {
		console.error( 'Could not find main element' );
		return;
	}
	ReactDOM.render( el( App ), main );
}

runApp();
