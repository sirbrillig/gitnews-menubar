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
	const isClosed = note.api.subject && note.api.subject.state && note.api.subject.state === 'closed';
	const isMerged = note.api.subject && note.api.subject.merged;
	const iconType = isMerged || isClosed ? 'checkmark-circle' : 'chat';
	const iconText = isMerged || isClosed ? 'closed' : 'open';
	const iconClasses = [
		'notification__type',
		...( isClosed && ! isMerged ? [ 'notification__type--closed' ] : [] ),
		...( isMerged ? [ 'notification__type--merged' ] : [] ),
	];

	return el( 'div', { className: 'notification' + noteClass, onClick },
		el( 'div', { className: iconClasses.join( ' ' ) }, el( Gridicon, { icon: iconType } ), el( 'span', { className: 'notification__type-text' }, iconText ) ),
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
