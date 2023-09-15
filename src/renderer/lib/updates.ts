import semver from 'semver';
import React from 'react';

interface LatestRelease {
	name: string;
	browser_download_url: string;
}

interface LatestReleaseResponse {
	assets?: LatestRelease[];
	tag_name: string;
	html_url: string;
}

async function getLatestRelease() {
	const url =
		'https://api.github.com/repos/sirbrillig/gitnews-menubar/releases/latest';
	const response = await fetch(url);
	const responseData: LatestReleaseResponse = await response.json();
	const asset =
		responseData.assets && responseData.assets.length > 0
			? responseData.assets[0]
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
	const isUpdateAvailable =
		semver.gt(newVersion, oldVersion) && !semver.prerelease(newVersion);
	window.electronApi.logMessage(
		`Found latest release ${newVersion}. Current version ${oldVersion}. Is update available? ${isUpdateAvailable}.`,
		'info'
	);
	if (isUpdateAvailable) {
		return latestVersionInfo;
	}
	return undefined;
}

export type GitnewsUpdateData =
	| {
			isUpdateAvailable: false;
			updateUrl: undefined;
			updatedVersion: undefined;
	  }
	| {
			isUpdateAvailable: true;
			updateUrl: string;
			updatedVersion: string;
	  };

export function useGetGitnewsUpdate(): GitnewsUpdateData {
	const [updateData, setUpdateData] = React.useState<GitnewsUpdateData>({
		isUpdateAvailable: false,
		updateUrl: undefined,
		updatedVersion: undefined,
	});
	React.useEffect(() => {
		getInfoIfUpdateAvailable()
			.then((latestVersionInfo) => {
				if (!latestVersionInfo) {
					return;
				}
				setUpdateData({
					isUpdateAvailable: true,
					updateUrl: latestVersionInfo.url,
					updatedVersion: latestVersionInfo.version,
				});
			})
			.catch((error) => {
				//eslint-disable-next-line no-console
				console.error(
					`Error fetching updated version: ${(error as Error).message}`
				);
			});
	});
	return updateData;
}
