import semver from 'semver';
import type { AppUpdate } from '../../shared-types';

export interface GitHubRelease {
	tag_name: string;
	name?: string | null;
	body?: string | null;
	html_url: string;
	published_at?: string | null;
	draft: boolean;
	prerelease: boolean;
	assets: Array<{ name: string; browser_download_url: string }>;
}

export interface UpdateCandidate extends AppUpdate {
	zipUrl: string;
	notes: string;
	pubDate: string;
}

/**
 * Pick the newest release that is newer than the current version and has a
 * zip for this platform and architecture.
 */
export function selectUpdate(
	releases: GitHubRelease[],
	currentVersion: string,
	{
		includeBetas,
		platform,
		arch,
	}: { includeBetas: boolean; platform: string; arch: string }
): UpdateCandidate | null {
	let best: UpdateCandidate | null = null;
	for (const release of releases) {
		const version = semver.valid(release.tag_name);
		if (!version || release.draft) {
			continue;
		}
		if (!includeBetas && (release.prerelease || semver.prerelease(version))) {
			continue;
		}
		if (!semver.gt(version, currentVersion)) {
			continue;
		}
		if (best && !semver.gt(version, best.version)) {
			continue;
		}
		const asset = release.assets.find(
			({ name }) =>
				name.includes(platform) && name.includes(arch) && name.endsWith('.zip')
		);
		if (!asset) {
			continue;
		}
		best = {
			version,
			releaseUrl: release.html_url,
			zipUrl: asset.browser_download_url,
			notes: release.body ?? '',
			pubDate: release.published_at ?? new Date().toISOString(),
		};
	}
	return best;
}
