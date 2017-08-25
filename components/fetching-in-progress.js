const React = require( 'react' );
const el = React.createElement;

function FetchingInProgress() {
	return el( 'div', { className: 'fetching-in-progress' },
		el( 'span', null, 'fetching notifications...' )
	);
}

module.exports = FetchingInProgress;
