// Actual auto updating requires a signed application, so this is the next best thing
// Modified from: https://github.com/jackd248/temps
function checkForUpdates( { fetch, semver, version } ) {
	console.log( 'Checking for new version...' );
	return fetch( 'https://raw.githubusercontent.com/sirbrillig/gitnews-menubar/master/package.json' )
		.then( response => {
			if ( ! response.ok ) {
				return Promise.reject( response );
			}
			return response;
		} )
		.then( response => response.json() )
		.then( response => {
			try {
				const newVersion = response.version;
				const oldVersion = version;
				console.log( `Comparing old version ${ oldVersion } and new version ${ newVersion }` );
				return {
					updateAvailable: semver.gt( newVersion, oldVersion ),
					newVersion,
					oldVersion,
				};
			} catch ( err ) {
				return Promise.reject( err );
			}
		} );
}

module.exports = {
	checkForUpdates,
};
