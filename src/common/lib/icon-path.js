const path = require( 'path' );
const debugFactory = require('debug');
const { app, nativeImage, nativeTheme } = require( 'electron' );

const debug = debugFactory('gitnews-menubar:main');

function getIconPathBuilder( appDir ) {
	const imagesDir = './static/images';
	const getIconPathForFilename = ( fileName ) => path.join( appDir, imagesDir, fileName );
	return function getIconPathForState( state ) {
		switch ( state ) {
			case 'error':
				return getIconPathForFilename( 'IconTemplateError.png' );
			case 'unseen':
				return nativeTheme.shouldUseDarkColors ? getIconPathForFilename( 'IconTemplateAlertDark.png' ) : getIconPathForFilename( 'IconTemplateAlert.png' );
			case 'unread':
				return nativeTheme.shouldUseDarkColors ? getIconPathForFilename( 'IconTemplateWarnDark.png' ) : getIconPathForFilename( 'IconTemplateWarn.png' );
			case 'offline':
				return nativeTheme.shouldUseDarkColors ? getIconPathForFilename( 'IconTemplateOfflineDark.png' ) : getIconPathForFilename( 'IconTemplateOffline.png' );
		}
		return nativeTheme.shouldUseDarkColors ? getIconPathForFilename( 'IconTemplateNormalDark.png' ) : getIconPathForFilename( 'IconTemplateNormal.png' );
	};
}

function getIconForState( state ) {
	const getIconPathForState = getIconPathBuilder( './' );
	const iconPath = getIconPathForState( state );
	debug('icon is', iconPath);
	return nativeImage.createFromPath(iconPath);
}

module.exports = {
	getIconPathBuilder,
	getIconForState,
	getIconPathForState: getIconPathBuilder( app.getAppPath() ),
};
