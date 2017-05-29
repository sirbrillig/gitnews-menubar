const React = require( 'react' );
const el = React.createElement;
const Gridicon = require( 'gridicons' );
const Logo = require( '../components/logo' );
const LastChecked = require( '../components/last-checked' );
const OfflineNotice = require( '../components/offline-notice' );

function Header( { openUrl, lastChecked, showConfig, offline, fetchNotifications, quitApp } ) {
	const openLink = ( event ) => {
		event.preventDefault();
		openUrl( event.target.href );
	};
	return el( 'header', null,
		el( 'div', { className: 'header__primary' },
			el( 'a', { className: 'quit-button', onClick: quitApp, href: '#', title: 'Quit' }, el( Gridicon, { icon: 'cross-small' } ) ),
			el( Logo, { onClick: openLink } ),
			showConfig ? el( 'a', { className: 'config-button', onClick: showConfig, href: '#', title: 'Configuration' }, el( Gridicon, { icon: 'cog' } ) ) : el( 'span', { className: 'config-spacer' } )
		),
		el( 'div', { className: 'header__secondary' },
			lastChecked && el( LastChecked, { lastChecked } )
		),
		offline && el( OfflineNotice, { fetchNotifications } )
	);
}

module.exports = Header;
