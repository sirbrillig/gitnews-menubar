const React = require( 'react' );
const el = React.createElement;

function Vanisher( { isVisible, children } ) {
	const className = isVisible ? 'vanisher vanisher--visible' : 'vanisher vanisher--invisible';
	return el( 'div', { className }, children );
}

module.exports = Vanisher;
