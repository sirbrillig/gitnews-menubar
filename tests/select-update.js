/* globals describe, it */
const { selectUpdate } = require('../src/main/lib/select-update');

const options = { includeBetas: false, platform: 'darwin', arch: 'arm64' };

function makeRelease(tag, overrides = {}) {
	return {
		tag_name: tag,
		html_url: `https://github.com/sirbrillig/gitnews-menubar/releases/tag/${tag}`,
		published_at: '2026-10-01T00:00:00Z',
		body: `Notes for ${tag}`,
		draft: false,
		prerelease: false,
		assets: [
			{
				name: `Gitnews-darwin-arm64-${tag.replace(/^v/, '')}.zip`,
				browser_download_url: `https://example.com/${tag}.zip`,
			},
		],
		...overrides,
	};
}

describe('selectUpdate()', function () {
	it('returns the newest release newer than the current version', function () {
		const releases = [
			makeRelease('v2.4.1'),
			makeRelease('v2.6.0'),
			makeRelease('v2.5.0'),
		];
		expect(selectUpdate(releases, '2.4.0', options)).toEqual({
			version: '2.6.0',
			releaseUrl:
				'https://github.com/sirbrillig/gitnews-menubar/releases/tag/v2.6.0',
			zipUrl: 'https://example.com/v2.6.0.zip',
			notes: 'Notes for v2.6.0',
			pubDate: '2026-10-01T00:00:00Z',
		});
	});

	it('returns null if there is nothing newer', function () {
		const releases = [makeRelease('v2.4.0'), makeRelease('v2.3.0')];
		expect(selectUpdate(releases, '2.4.0', options)).toBeNull();
	});

	it('ignores drafts', function () {
		const releases = [makeRelease('v2.5.0', { draft: true })];
		expect(selectUpdate(releases, '2.4.0', options)).toBeNull();
	});

	it('ignores prereleases when betas are disabled', function () {
		const releases = [
			makeRelease('v2.5.0-beta.1', { prerelease: true }),
			makeRelease('v2.6.0-beta.1'),
		];
		expect(selectUpdate(releases, '2.4.0', options)).toBeNull();
	});

	it('includes prereleases when betas are enabled', function () {
		const releases = [
			makeRelease('v2.5.0-beta.2', { prerelease: true }),
			makeRelease('v2.5.0-beta.1', { prerelease: true }),
		];
		expect(
			selectUpdate(releases, '2.5.0-beta.1', { ...options, includeBetas: true })
				?.version
		).toBe('2.5.0-beta.2');
	});

	it('offers the stable release over its betas', function () {
		const releases = [
			makeRelease('v2.5.0'),
			makeRelease('v2.5.0-beta.2', { prerelease: true }),
		];
		expect(
			selectUpdate(releases, '2.5.0-beta.1', { ...options, includeBetas: true })
				?.version
		).toBe('2.5.0');
	});

	it('ignores releases without a zip for this platform and arch', function () {
		const releases = [
			makeRelease('v2.6.0', {
				assets: [
					{
						name: 'Gitnews-darwin-x64-2.6.0.zip',
						browser_download_url: 'https://example.com/x64.zip',
					},
				],
			}),
			makeRelease('v2.5.0'),
		];
		expect(selectUpdate(releases, '2.4.0', options)?.version).toBe('2.5.0');
	});

	it('ignores tags that are not valid versions', function () {
		const releases = [makeRelease('latest')];
		expect(selectUpdate(releases, '2.4.0', options)).toBeNull();
	});
});
