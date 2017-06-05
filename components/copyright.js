const React = require( 'react' );
const el = React.createElement;

function Copyright( { openUrl, version } ) {
	const openLink = ( event ) => {
		event.preventDefault();
		openUrl( event.target.href );
	};
	return el( 'div', { className: 'copyright' },
		el( 'div', { className: 'copyright__text' },
			el( 'a', { href: 'https://github.com/sirbrillig/gitnews-menubar', onClick: openLink }, 'gitnews-menubar' ),
			' - ',
			el( 'span', null, ` v${ version }` ),
			' - ',
			el( 'span', null, 'copyright 2017 Payton Swick' )
		)
	);
}

module.exports = Copyright;
