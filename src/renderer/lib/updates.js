import semver from 'semver';
import React from 'react';

async function getLatestRelease() {
	const url =
		'https://api.github.com/repos/sirbrillig/gitnews-menubar/releases/latest';
	const response = await fetch(url);
	const responseData = await response.json();
	const asset = responseData.assets
		? responseData.assets.find(asset => asset.name.includes('dmg'))
		: null;
	if (!asset) {
		console.error('Latest release not found in', responseData);
		throw new Error("Couldn't find latest release.");
	}
	const latestRelease = {
		version: responseData.tag_name,
		url: responseData.html_url,
		download_url: asset.browser_download_url,
	};
	return latestRelease;
}

async function getInfoIfUpdateAvailable() {
	const oldVersion = await window.electronApi.getVersion();
	const latestVersionInfo = await getLatestRelease();
	const newVersion = latestVersionInfo.version;
	const isUpdateAvailable = semver.gt(newVersion, oldVersion) && !semver.prerelease(newVersion);
	if (isUpdateAvailable) {
		return latestVersionInfo;
	}
	return undefined;
}

export function useGetGitnewsUpdate() {
	const [updateData, setUpdateData] = React.useState({isUpdateAvailable: false, updateUrl: undefined, updatedVersion: undefined});
	React.useEffect(() => {
		getInfoIfUpdateAvailable().then((latestVersionInfo) => {
			if (! latestVersionInfo) {
				return;
			}
			setUpdateData({isUpdateAvailable: true, updateUrl: latestVersionInfo.url, updatedVersion: latestVersionInfo.version})
		})
	});
	return updateData;
}
