const React = require( 'react' );
const el = React.createElement;

function UncheckedNotice( { fetchingInProgress, openUrl } ) {
	const openLink = ( event ) => {
		event.preventDefault();
		openUrl( event.target.href );
	};
	const message = fetchingInProgress ? 'Checking for notifications...' : 'Preparing to fetch notifications...';
	return el( 'div', { className: 'unchecked-notice' },
		el( 'h2', null, message ),
		el( 'p', null,
			'If this message does not disappear, please create a new issue ',
			el( 'a', { href: 'https://github.com/sirbrillig/gitnews-menubar/issues/new', onClick: openLink }, 'here' ),
			' describing what happened.'
		)
	);
}

module.exports = UncheckedNotice;
