const React = require( 'react' );
const el = React.createElement;

function OfflineNotice( { fetchNotifications } ) {
	return el( 'div', { className: 'offline-notice' },
		el( 'span', null, 'I\'m having trouble connecting. Retrying shortly. ' ),
		el( 'a', { href: '#', onClick: fetchNotifications }, 'Retry now' )
	);
}

module.exports = OfflineNotice;
