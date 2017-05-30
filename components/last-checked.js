const React = require( 'react' );
const el = React.createElement;
const date = require( 'date-fns' );

function LastChecked( { lastSuccessfulCheck } ) {
	if ( ! lastSuccessfulCheck ) {
		return null;
	}
	const lastCheckedString = date.distanceInWords( Date.now(), date.parse( lastSuccessfulCheck ), { addSuffix: true } );
	return el( 'div', { className: 'last-checked' }, 'last checked: ' + lastCheckedString );
}

module.exports = LastChecked;
