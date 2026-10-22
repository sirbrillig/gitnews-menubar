import { app, autoUpdater } from 'electron';
import { createServer, type Server } from 'http';
import type { AddressInfo } from 'net';
import { logMessage } from './logging';
import type { AppUpdate } from '../../shared-types';
import {
	selectUpdate,
	type GitHubRelease,
	type UpdateCandidate,
} from './select-update';

const releasesUrl =
	'https://api.github.com/repos/sirbrillig/gitnews-menubar/releases?per_page=30';

let availableUpdate: UpdateCandidate | null = null;

export async function checkForAppUpdate(
	includeBetas: boolean
): Promise<AppUpdate | null> {
	const response = await fetch(releasesUrl);
	if (!response.ok) {
		throw new Error(`Failed to list releases: ${response.status}`);
	}
	const releases: GitHubRelease[] = await response.json();
	const currentVersion = app.getVersion();
	availableUpdate = selectUpdate(releases, currentVersion, {
		includeBetas,
		platform: process.platform,
		arch: process.arch,
	});
	logMessage(
		`Checked for updates (betas ${includeBetas ? 'included' : 'excluded'}). Current version ${currentVersion}. Found ${availableUpdate?.version ?? 'nothing newer'}.`,
		'info'
	);
	if (!availableUpdate) {
		return null;
	}
	const { version, releaseUrl } = availableUpdate;
	return { version, releaseUrl };
}

/**
 * Download the update found by `checkForAppUpdate()`. Resolves when it is
 * ready to install with `installAppUpdate()`.
 *
 * Squirrel.Mac only accepts a feed URL (and won't read a `file://` one), so
 * we briefly serve the release we already chose from a local server.
 */
export async function downloadAppUpdate(): Promise<void> {
	const update = availableUpdate;
	if (!update) {
		throw new Error('No update is available to download.');
	}
	const feedServer = await startFeedServer({
		url: update.zipUrl,
		name: update.version,
		notes: update.notes,
		pub_date: update.pubDate,
	});
	const { port } = feedServer.address() as AddressInfo;
	logMessage(
		`Downloading update ${update.version} from ${update.zipUrl}`,
		'info'
	);
	try {
		await new Promise<void>((resolve, reject) => {
			const cleanup = () => {
				autoUpdater.off('update-downloaded', onDownloaded);
				autoUpdater.off('update-not-available', onNotAvailable);
				autoUpdater.off('error', onError);
			};
			const onDownloaded = () => {
				cleanup();
				resolve();
			};
			const onNotAvailable = () => {
				cleanup();
				reject(new Error('The updater did not find the update.'));
			};
			const onError = (error: Error) => {
				cleanup();
				reject(error);
			};
			autoUpdater.on('update-downloaded', onDownloaded);
			autoUpdater.on('update-not-available', onNotAvailable);
			autoUpdater.on('error', onError);
			autoUpdater.setFeedURL({
				url: `http://127.0.0.1:${port}/update`,
			});
			autoUpdater.checkForUpdates();
		});
		logMessage(`Update ${update.version} is ready to install`, 'info');
	} catch (error) {
		logMessage(
			`Failed to download update: ${(error as Error).message}`,
			'error'
		);
		throw error;
	} finally {
		feedServer.close();
	}
}

function startFeedServer(feed: Record<string, string>): Promise<Server> {
	const body = JSON.stringify(feed);
	const server = createServer((_request, response) => {
		response.writeHead(200, { 'Content-Type': 'application/json' });
		response.end(body);
	});
	return new Promise((resolve, reject) => {
		server.once('error', reject);
		server.listen(0, '127.0.0.1', () => resolve(server));
	});
}

export function installAppUpdate(): void {
	logMessage('Restarting to install update', 'info');
	autoUpdater.quitAndInstall();
}
