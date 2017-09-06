const React = require( 'react' );
const el = React.createElement;
const Gridicon = require( 'gridicons' );
const Logo = require( '../components/logo' );
const LastChecked = require( '../components/last-checked' );
const OfflineNotice = require( '../components/offline-notice' );
const FetchingInProgress = require( '../components/fetching-in-progress' );
const createUpdater = require( '../components/updater' );
const Vanisher = require( '../components/vanisher' );
const UpdatingLastChecked = createUpdater( LastChecked );
const UpdatingOfflineNotice = createUpdater( OfflineNotice );

function LeftButton( { hideConfig, showConfig } ) {
	if ( hideConfig ) {
		return el( 'a', { className: 'back-button', href: '#', onClick: hideConfig, title: 'Back' }, el( Gridicon, { icon: 'chevron-left' } ) );
	}
	if ( showConfig ) {
		return el( 'a', { className: 'config-button', onClick: showConfig, href: '#', title: 'Configuration' }, el( Gridicon, { icon: 'cog' } ) );
	}
	return el( 'span', { className: 'config-spacer' } );
}

function Header( { openUrl, lastSuccessfulCheck, lastChecked, fetchInterval, showConfig, offline, fetchNotifications, hideConfig, fetchingInProgress } ) {
	const openLink = ( event ) => {
		event.preventDefault();
		openUrl( event.target.href );
	};
	return el( 'header', null,
		el( 'div', { className: 'header__primary' },
			el( LeftButton, { hideConfig, showConfig } ),
			el( Logo, { onClick: openLink } ),
			el( 'span', { className: 'config-spacer' } )
		),
		el( 'div', { className: 'header__secondary' },
			lastSuccessfulCheck && el( UpdatingLastChecked, { lastSuccessfulCheck } )
		),
		el( Vanisher, { isVisible: offline }, el( UpdatingOfflineNotice, { fetchNotifications, lastChecked, fetchInterval } ) ),
		el( Vanisher, { isVisible: fetchingInProgress }, el( FetchingInProgress ) )
	);
}

module.exports = Header;
