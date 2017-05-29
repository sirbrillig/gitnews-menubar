const React = require( 'react' );
const el = React.createElement;

function UncheckedNotice() {
	return el( 'div', { className: 'unchecked-notice' },
		el( 'h2', null, 'Checking for notifications...' )
	);
}

module.exports = UncheckedNotice;
