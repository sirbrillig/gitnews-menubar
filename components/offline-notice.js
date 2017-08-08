const React = require( 'react' );
const { getSecondsUntilNextFetch } = require( '../lib/helpers' );
const el = React.createElement;

function OfflineNotice( { fetchNotifications, lastChecked, fetchInterval } ) {
	const secondsRemaining = getSecondsUntilNextFetch( lastChecked, fetchInterval );
	if ( secondsRemaining < 1 ) {
		return el( 'div', { className: 'offline-notice' },
			el( 'span', null, 'I\'m having trouble connecting. Retrying now...' )
		);
	}
	return el( 'div', { className: 'offline-notice' },
		el( 'span', null, `I'm having trouble connecting. Retrying in ${ secondsRemaining } seconds. ` ),
		el( 'a', { href: '#', onClick: fetchNotifications }, 'Retry now' )
	);
}

module.exports = OfflineNotice;
