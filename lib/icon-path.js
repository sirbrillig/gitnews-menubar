const path = require( 'path' );
const { app, systemPreferences, nativeImage } = require( 'electron' );

function getIconPathBuilder( appDir ) {
	const imagesDir = 'images';
	const getIconPathForFilename = ( fileName ) => path.join( appDir, imagesDir, fileName );
	return function getIconPathForState( state ) {
		switch ( state ) {
			case 'error':
				return getIconPathForFilename( 'IconTemplateError.png' );
			case 'unseen':
				return systemPreferences.isDarkMode() ? getIconPathForFilename( 'IconTemplateAlertDark.png' ) : getIconPathForFilename( 'IconTemplateAlert.png' );
			case 'unread':
				return systemPreferences.isDarkMode() ? getIconPathForFilename( 'IconTemplateWarnDark.png' ) : getIconPathForFilename( 'IconTemplateWarn.png' );
			case 'offline':
				return systemPreferences.isDarkMode() ? getIconPathForFilename( 'IconTemplateOfflineDark.png' ) : getIconPathForFilename( 'IconTemplateOffline.png' );
		}
		return systemPreferences.isDarkMode() ? getIconPathForFilename( 'IconTemplateNormalDark.png' ) : getIconPathForFilename( 'IconTemplateNormal.png' );
	};
}

function getIconForState( state ) {
	const getIconPathForState = getIconPathBuilder( app.getAppPath() );
	return nativeImage.createFromPath( getIconPathForState( state ) );
}

module.exports = {
	getIconPathBuilder,
	getIconForState,
	getIconPathForState: getIconPathBuilder( app.getAppPath() ),
};
