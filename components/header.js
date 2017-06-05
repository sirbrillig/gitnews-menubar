const React = require( 'react' );
const el = React.createElement;
const Gridicon = require( 'gridicons' );
const Logo = require( '../components/logo' );
const LastChecked = require( '../components/last-checked' );
const OfflineNotice = require( '../components/offline-notice' );
const createUpdater = require( '../components/updater' );
const UpdatingLastChecked = createUpdater( LastChecked );
const UpdatingOfflineNotice = createUpdater( OfflineNotice );

function Header( { openUrl, lastSuccessfulCheck, showConfig, offline, fetchNotifications, getSecondsUntilNextFetch } ) {
	const openLink = ( event ) => {
		event.preventDefault();
		openUrl( event.target.href );
	};
	return el( 'header', null,
		el( 'div', { className: 'header__primary' },
			el( 'span', { className: 'config-spacer' } ),
			el( Logo, { onClick: openLink } ),
			showConfig ? el( 'a', { className: 'config-button', onClick: showConfig, href: '#', title: 'Configuration' }, el( Gridicon, { icon: 'cog' } ) ) : el( 'span', { className: 'config-spacer' } )
		),
		el( 'div', { className: 'header__secondary' },
			lastSuccessfulCheck && el( UpdatingLastChecked, { lastSuccessfulCheck } )
		),
		offline && el( UpdatingOfflineNotice, { fetchNotifications, getSecondsUntilNextFetch } )
	);
}

module.exports = Header;
