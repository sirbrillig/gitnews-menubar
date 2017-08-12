const getLatestRelease = require( 'get-latest-release' );

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
				newVersionDownloadUrl: response.download_url,
			};
		} catch ( err ) {
			return Promise.reject( err );
		}
	};
}

module.exports = {
	checkForUpdates: checkForNewVersion,
};
