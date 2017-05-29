const React = require( 'react' );
const el = React.createElement;

const Copyright = require( '../components/copyright' );
const Attributions = require( '../components/attributions' );

function ConfigPage( { showEditToken, hideConfig, openUrl } ) {
	return el( 'div', { className: 'config-page' },
		el( 'h2', { className: 'config-page__title' }, 'Configuration' ),
		el( 'a', { href: '#', onClick: hideConfig }, '< Back' ),
		el( 'h3', null, 'Token' ),
		el( 'div', null, 'Would you like to change your authentication token?' ),
		el( 'a', { href: '#', onClick: showEditToken }, 'Edit token' ),
		el( Attributions, { openUrl } ),
		el( Copyright, { openUrl } )
	);
}

module.exports = ConfigPage;
