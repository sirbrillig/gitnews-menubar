const React = require( 'react' );
const el = React.createElement;

const Copyright = require( '../components/copyright' );
const Attributions = require( '../components/attributions' );

function ConfigPage( { showEditToken, openUrl, version, quitApp, checkForUpdates, isAutoLoadEnabled, changeAutoLoad } ) {
	const toggleAutoLoad = ( event ) => changeAutoLoad( event.target.checked );
	return el( 'div', { className: 'config-page' },
		el( 'h2', { className: 'config-page__title' }, 'Configuration' ),
		el( 'h3', null, 'Token' ),
		el( 'div', null, 'Would you like to change your authentication token?' ),
		el( 'a', { href: '#', onClick: showEditToken }, 'Edit token' ),
		el( 'h3', null, 'Settings' ),
		el( 'input', { type: 'checkbox', id: 'auto-load-setting', className: 'auto-load-setting', checked: isAutoLoadEnabled, onChange: toggleAutoLoad } ),
		el( 'label', { htmlFor: 'auto-load-setting', className: 'auto-load-setting-label' }, 'Launch Gitnews at login' ),
		el( Attributions, { openUrl } ),
		el( 'div', { className: 'config-page__buttons' },
			el( 'a', { className: 'btn quit-button', onClick: quitApp, href: '#', title: 'Quit' }, 'Quit' ),
			el( 'a', { className: 'btn', onClick: checkForUpdates, href: '#', title: 'Check for Updates' }, 'Check for Updates' )
		),
		el( Copyright, { openUrl, version } )
	);
}

module.exports = ConfigPage;
