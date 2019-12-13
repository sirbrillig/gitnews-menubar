import React from 'react' ;

const el = React.createElement;

export default function Vanisher( { isVisible, children } ) {
	const className = isVisible ? 'vanisher vanisher--visible' : 'vanisher vanisher--invisible';
	return el( 'div', { className }, children );
}
