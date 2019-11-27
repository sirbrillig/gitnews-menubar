const React = require( 'react' );
const Gridicon = require( 'gridicons' );
const el = React.createElement;
const debugFactory = require( 'debug' );
const date = require( 'date-fns' );
const EnsuredImage = require( '@sirbrillig/ensured-image' );

const debug = debugFactory( 'gitnews-menubar' );

function Notification( { note, openUrl, markRead, token } ) {
	const onClick = () => {
		debug( 'clicked on notification', note );
		markRead( token, note );
		openUrl( note.commentUrl );
	};
	const timeString = date.distanceInWords( Date.now(), date.parse( note.updatedAt ), { addSuffix: true } );
	const noteClass = note.unread ? ' notification__unread' : ' notification__read';
	const defaultAvatar = `https://avatars.io/twitter/${ note.repositoryFullName }`;
	const avatarSrc = note.commentAvatar || note.repositoryOwnerAvatar || defaultAvatar;
	// TODO: show different UI for different reasons (https://developer.github.com/v3/activity/notifications/#notification-reasons)
	// const didStateChange = note.api.notification && note.api.notification.reason && note.api.notification.reason === 'state_change';
	const isMerged = note.api.subject && note.api.subject.merged;
	const iconType = isMerged ? 'checkmark-circle' : 'chat';
	const iconClass = isMerged ? 'notification__type--merged' : '';

	return el( 'div', { className: 'notification' + noteClass, onClick },
		el( 'div', { className: [ 'notification__type', iconClass ].join( ' ' ) }, el( Gridicon, { icon: iconType } ) ),
		note.unread ? el( 'span', { className: 'notification__new-dot' } ) : null,
		el( 'div', { className: 'notification__image' }, el( EnsuredImage, { src: avatarSrc } ) ),
		el( 'div', { className: 'notification__body' },
			el( 'div', { className: 'notification__repo' }, note.repositoryFullName ),
			el( 'div', { className: 'notification__title' }, note.title ),
			el( 'div', { className: 'notification__time' }, timeString )
		)
	);
}

module.exports = Notification;
