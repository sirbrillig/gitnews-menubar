const React = require( 'react' );
const el = React.createElement;
const date = require( 'date-fns' );

function LastChecked( { lastChecked } ) {
	if ( ! lastChecked ) {
		return null;
	}
	const lastCheckedString = date.distanceInWords( Date.now(), date.parse( lastChecked ), { addSuffix: true } );
	return el( 'div', { className: 'last-checked' }, 'last checked: ' + lastCheckedString );
}

module.exports = LastChecked;
