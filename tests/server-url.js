/* globals describe, it */
const { isPublicGithubServerUrl } = require('../src/main/lib/server-url');

describe('isPublicGithubServerUrl()', function () {
	it.each([
		undefined,
		'',
		'https://api.github.com',
		'https://github.com',
		'https://github.com/',
		'https://www.github.com',
		' HTTPS://GitHub.com ',
	])('returns true for %p', function (serverUrl) {
		expect(isPublicGithubServerUrl(serverUrl)).toBe(true);
	});

	it.each(['https://github.a8c.com', 'https://github.example.com/'])(
		'returns false for %p',
		function (serverUrl) {
			expect(isPublicGithubServerUrl(serverUrl)).toBe(false);
		}
	);
});
