/* globals describe, it */
const { getGravatarUrl } = require('../src/main/lib/gravatar');

describe('getGravatarUrl()', function () {
	it('returns a sha256 Gravatar URL that 404s when there is no avatar', function () {
		expect(getGravatarUrl('MyEmailAddress@example.com ')).toEqual(
			'https://gravatar.com/avatar/84059b07d4be67b806386c0aad8070a23f18836bbaae342275dc0a83414c32ee?s=80&d=404'
		);
	});

	it('returns undefined for a missing email', function () {
		expect(getGravatarUrl(null)).toBeUndefined();
		expect(getGravatarUrl(undefined)).toBeUndefined();
		expect(getGravatarUrl('  ')).toBeUndefined();
	});

	it('returns undefined for a value that is not an email', function () {
		expect(getGravatarUrl('not-an-email')).toBeUndefined();
	});
});
