const React = require( 'react' );
const el = React.createElement;

function Copyright( { openUrl } ) {
	const openLink = ( event ) => {
		event.preventDefault();
		openUrl( event.target.href );
	};
	return el( 'div', { className: 'copyright' },
		el( 'a', { href: 'https://github.com/sirbrillig/gitnews-menubar', onClick: openLink }, 'gitnews-menubar' ),
		' - ',
		el( 'span', null, 'copyright 2017 Payton Swick' )
	);
}

module.exports = Copyright;
