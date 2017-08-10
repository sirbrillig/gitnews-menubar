const React = require( 'react' );
const el = React.createElement;

function Attributions( { openUrl } ) {
	const openLink = ( event ) => {
		event.preventDefault();
		openUrl( event.target.href );
	};
	return el( 'div', { className: 'attributions' },
		el( 'h3', null, 'Attribution' ),
		el( 'div', { className: 'attributions__text' },
			el( 'img', { src: './IconTemplate.png', className: 'attributions__icon' } ),
			'Bell icon made by ',
			el( 'a', { onClick: openLink, href: 'http://www.flaticon.com/authors/daniel-bruce', title: 'Daniel Bruce' }, 'Daniel Bruce' ),
			' from ',
			el( 'a', { onClick: openLink, href: 'http://www.flaticon.com', title: 'Flaticon' }, 'Flaticon' ),
			' (',
			el( 'a', { onClick: openLink, href: 'http://creativecommons.org/licenses/by/3.0/', title: 'Creative Commons BY 3.0' }, 'CC 3 BY' ),
			') '
		)
	);
}

module.exports = Attributions;
