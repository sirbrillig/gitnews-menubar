async function checkForNewVersion({ version, semver }) {
	return getLatestRelease().then(getVersionComparator({ version, semver }));
}

function getVersionComparator({ version, semver }) {
	return async function isVersionNewer(latestVersionData) {
		const newVersion = latestVersionData.version;
		const oldVersion = version;
		console.log(
			`Comparing current version ${oldVersion} and latest version ${newVersion}`
		);
		const updateAvailable =
			semver.gt(newVersion, oldVersion) && !semver.prerelease(newVersion);
		return {
			updateAvailable,
			newVersion,
			oldVersion,
			newVersionUrl: latestVersionData.url,
			newVersionDownloadUrl:
				latestVersionData.asset && latestVersionData.asset.download_url,
		};
	};
}

function checkForUpdates({
	showCurrentVersion,
	version,
	semver,
	dialog,
	openUrl,
	download,
}) {
	checkForNewVersion({ version, semver })
		.then(response => {
			if (!response.updateAvailable) {
				showCurrentVersion &&
					dialog.showMessageBox({
						type: 'info',
						message: `You have the latest version of Gitnews, ${response.oldVersion}!`,
					});
				return;
			}
			const confirm = dialog.showMessageBox({
				type: 'question',
				message:
					'A new version ' + response.newVersion + ' of Gitnews is available.',
				detail: 'Do you want to download it now?',
				buttons: ['Yes', 'No'],
			});
			if (confirm === 0) {
				if (download && response.newVersionDownloadUrl) {
					download(response.newVersionDownloadUrl);
				} else {
					openUrl(response.newVersionUrl);
				}
			}
		})
		.catch(err => {
			console.error('Error while checking for updates:', err);
		});
}

async function getLatestRelease() {
	const url =
		'https://api.github.com/repos/sirbrillig/gitnews-menubar/releases/latest';
	const response = await fetch(url);
	const responseData = response.json();
	const asset = response.assets
		? response.assets.find(asset => asset.name.includes('dmg'))
		: null;
	if (!asset) {
		throw new Error("Couldn't find latest release.");
	}
	const latestRelease = {
		version: responseData.tag_name,
		url: responseData.html_url,
		download_url: asset.browser_download_url,
	};
	return latestRelease;
}

module.exports = {
	checkForUpdates,
};
