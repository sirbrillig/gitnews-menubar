const importJsx = require( 'import-jsx' );
const React = require( 'react' );
const Gridicon = require( 'gridicons' );
const Logo = importJsx( '../components/logo' );
const LastChecked = require( '../components/last-checked' );
const OfflineNotice = require( '../components/offline-notice' );
const createUpdater = require( '../components/updater' );
const UpdatingLastChecked = createUpdater( LastChecked );
const UpdatingOfflineNotice = createUpdater( OfflineNotice );

function LeftButton( { hideConfig, showConfig } ) {
	if ( hideConfig ) {
		return <a className="back-button" href="#" onClick={ hideConfig } title="Back"><Gridicon icon="chevron-left" /></a>;
	}
	if ( showConfig ) {
		return <a className="config-button" href="#" onClick={ showConfig } title="Configuration"><Gridicon icon="cog" /></a>;
	}
	return <span className="config-spacer" />;
}

function Header( { openUrl, lastSuccessfulCheck, showConfig, offline, fetchNotifications, getSecondsUntilNextFetch, hideConfig } ) {
	const openLink = ( event ) => {
		event.preventDefault();
		openUrl( event.target.href );
	};
	return (
		<header>
			<div className="header__primary">
				<LeftButton hideConfig={ hideConfig } showConfig={ showConfig } />
				<Logo onClick={ openLink } />
				<span className="config-spacer" />
			</div>
			<div className="header__secondary">
				{ lastSuccessfulCheck && <UpdatingLastChecked lastSuccessfulCheck={ lastSuccessfulCheck } /> }
			</div>
			{ offline && <UpdatingOfflineNotice fetchNotifications={ fetchNotifications } getSecondsUntilNextFetch={ getSecondsUntilNextFetch } /> }
		</header>
	);
}

module.exports = Header;
