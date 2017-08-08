/* globals fetch */
const { shell, remote, ipcRenderer } = require( 'electron' );
const semver = require( 'semver' );
const { version } = require( '../package.json' );
const { checkForUpdates } = require( '../lib/updates' );

function openUrl( url ) {
	shell.openExternal( url );
}

function updateCheck( dispatch ) {
	checkForUpdates( { fetch, version, semver } )
		.then( response => {
			if ( ! response.updateAvailable ) {
				remote.dialog.showMessageBox( {
					type: 'info',
					message: `You have the latest version of Gitnews, ${ response.oldVersion }!`,
				} );
				return;
			}
			const confirm = remote.dialog.showMessageBox( {
				type: 'question',
				message: 'A new version ' + response.newVersion + ' of Gitnews is available.',
				detail: 'Do you want to download it now?',
				buttons: [ 'Yes', 'No' ]
			} );
			if ( confirm === 0 ) {
				dispatch( openUrl( 'https://github.com/sirbrillig/gitnews-menubar/releases' ) );
			}
		} )
		.catch( err => {
			console.error( 'Error while checking for updates:', err );
		} );
}

function setIcon( nextIcon ) {
	ipcRenderer.send( 'set-icon', nextIcon );
}

const electronMiddleware = store => next => action => { // eslint-disable-line no-unused-vars
	switch ( action.type ) {
		case 'OPEN_URL':
			return openUrl( action.url );
		case 'CHECK_FOR_UPDATES':
			return updateCheck( next );
		case 'SET_ICON':
			return setIcon( action.icon );
	}
	next( action );
};

module.exports = {
	electronMiddleware,
};
