const React = require( 'react' );
const el = React.createElement;

const Copyright = require( '../components/copyright' );
const Attributions = require( '../components/attributions' );

function ConfigPage( { showEditToken, openUrl, version, quitApp, checkForUpdates } ) {
	return el( 'div', { className: 'config-page' },
		el( 'h2', { className: 'config-page__title' }, 'Configuration' ),
		el( 'h3', null, 'Token' ),
		el( 'div', null, 'Would you like to change your authentication token?' ),
		el( 'a', { href: '#', onClick: showEditToken }, 'Edit token' ),
		el( Attributions, { openUrl } ),
		el( 'div', { className: 'config-butons' },
			el( 'a', { className: 'btn quit-button', onClick: quitApp, href: '#', title: 'Quit' }, 'Quit' ),
			el( 'a', { className: 'btn', onClick: checkForUpdates, href: '#', title: 'Check for Updates' }, 'Check for Updates' )
		),
		el( Copyright, { openUrl, version } )
	);
}

module.exports = ConfigPage;
