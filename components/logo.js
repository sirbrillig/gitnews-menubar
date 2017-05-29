const React = require( 'react' );
const el = React.createElement;

function Logo( { onClick } ) {
	return el( 'h1', null,
		el( 'a', { href: 'https://github.com/sirbrillig/gitnews-menubar', onClick },
			'Gitnews'
		)
	);
}

module.exports = Logo;
