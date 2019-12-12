const React = require( 'react' );
const el = React.createElement;
const Gridicon = require( 'gridicons' );
const Notification = require( '../components/notification' );
const { getNoteId } = require( 'common/lib/helpers' );

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

function NotificationsArea( { newNotes, readNotes, markRead, markUnread, openUrl, token } ) {
	const noteRows = newNotes.length ? newNotes.map( note => el( Notification, { note, key: getNoteId( note ), markRead, markUnread, token, openUrl } ) ) : el( NoNotifications );
	const readNoteRows = readNotes.map( note => el( Notification, { note, key: getNoteId( note ), markRead, markUnread, token, openUrl } ) );
	return el( 'div', { className: 'notifications-area' },
		noteRows,
		readNoteRows
	);
}

module.exports = NotificationsArea;
