const React = require( 'react' );
const el = React.createElement;
const Gridicon = require( 'gridicons' );
const debugFactory = require( 'debug' );
const date = require( 'date-fns' );
const EnsuredImage = require( '@sirbrillig/ensured-image' );
const { getNoteId } = require( '../lib/helpers' );

const debug = debugFactory( 'gitnews-menubar' );

function Notification( { note, openUrl, markRead } ) {
	const onClick = () => {
		debug( 'clicked on notification', note );
		markRead( note );
		openUrl( note.commentUrl );
	};
	const timeString = date.distanceInWords( Date.now(), date.parse( note.updatedAt ), { addSuffix: true } );
	const noteClass = note.unread ? ' notification__unread' : ' notification__read';
	return el( 'div', { className: 'notification' + noteClass, onClick },
		el( 'div', { className: 'notification__image' }, el( EnsuredImage, { src: note.commentAvatar } ) ),
		el( 'div', { className: 'notification__body' },
			el( 'div', { className: 'notification__repo' }, note.repositoryFullName ),
			el( 'div', { className: 'notification__title' }, note.title ),
			el( 'div', { className: 'notification__time' }, timeString )
		)
	);
}

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

function NotificationsArea( { newNotes, readNotes, markRead, openUrl } ) {
	const noteRows = newNotes.length ? newNotes.map( note => el( Notification, { note, key: getNoteId( note ), markRead, openUrl } ) ) : el( NoNotifications );
	const readNoteRows = readNotes.map( note => el( Notification, { note, key: getNoteId( note ), markRead, openUrl } ) );
	return el( 'div', { className: 'notifications-area' },
		noteRows,
		readNoteRows
	);
}

module.exports = NotificationsArea;
