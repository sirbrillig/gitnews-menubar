const getLatestRelease = require( 'get-latest-release' );
const { get } = require( 'lodash' );

function checkForNewVersion( { version, semver } ) {
	return getLatestRelease( {
		owner: 'sirbrillig',
		repo: 'gitnews-menubar',
		ext: 'dmg',
	} )
		.then( getVersionComparator( { version, semver } ) );
}

function getVersionComparator( { version, semver } ) {
	return function isVersionNewer( response ) {
		try {
			const newVersion = response.version;
			const oldVersion = version;
			console.log( `Comparing current version ${ oldVersion } and latest version ${ newVersion }` );
			const updateAvailable = semver.gt( newVersion, oldVersion ) && ! semver.prerelease( newVersion );
			return {
				updateAvailable,
				newVersion,
				oldVersion,
				newVersionUrl: response.url,
				newVersionDownloadUrl: get( response, 'asset.download_url' ),
			};
		} catch ( err ) {
			return Promise.reject( err );
		}
	};
}

function checkForUpdates( { showCurrentVersion, version, semver, dialog, openUrl, download } ) {
	checkForNewVersion( { version, semver } )
		.then( response => {
			if ( ! response.updateAvailable ) {
				showCurrentVersion && dialog.showMessageBox( {
					type: 'info',
					message: `You have the latest version of Gitnews, ${ response.oldVersion }!`,
				} );
				return;
			}
			const confirm = dialog.showMessageBox( {
				type: 'question',
				message: 'A new version ' + response.newVersion + ' of Gitnews is available.',
				detail: 'Do you want to download it now?',
				buttons: [ 'Yes', 'No' ]
			} );
			if ( confirm === 0 ) {
				if ( download && response.newVersionDownloadUrl ) {
					download( response.newVersionDownloadUrl );
				} else {
					openUrl( response.newVersionUrl );
				}
			}
		} )
		.catch( err => {
			console.error( 'Error while checking for updates:', err );
		} );
}

module.exports = {
	checkForUpdates,
};
