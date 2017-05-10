/* globals window */
require( 'dotenv' ).config();
const { getNotifications } = require( 'gitnews' );
const Conf = require( 'conf' );
const config = new Conf();

function getToken() {
	return process.env.GITNEWS_TOKEN || config.get( 'gitnews-token' );
}

function bindToTarget( target, func ) {
	return func.bind( null, target );
}

function showNotification( target, notification ) {
	console.log( 'showing notification', notification );
	target.innerHTML = notification.subject.title;
}

function showNoNotifications( target ) {
	target.innerHTML = 'No Notifications!';
}

function runApp() {
	const main = window.document.querySelector( '.main' );
	if ( ! main ) {
		return;
	}
	main.innerHTML = 'this is javascript';
	const showNote = bindToTarget( main, showNotification );
	const noNotes = bindToTarget( main, showNoNotifications );
	getNotifications( getToken() )
		.then( function( notifications ) {
			if ( notifications.length < 1 ) {
				noNotes();
				return;
			}
			notifications.map( showNote );
		} )
		.catch( function( err ) {
			main.innerHTML = 'this is an error: ' + err;
		} );
}

runApp();
