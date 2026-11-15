/* globals describe, it */
const { doDisplayNamesMatch } = require('../src/main/lib/public-avatar');

describe('doDisplayNamesMatch()', function () {
	it('returns true for the same name', function () {
		expect(doDisplayNamesMatch('Jane Doe', 'Jane Doe')).toBe(true);
	});

	it('ignores case and whitespace', function () {
		expect(doDisplayNamesMatch(' jane  doe', 'Jane Doe ')).toBe(true);
	});

	it('returns false for different names', function () {
		expect(doDisplayNamesMatch('Jane Doe', 'John Doe')).toBe(false);
	});

	it('returns false when either name is missing', function () {
		expect(doDisplayNamesMatch('', '')).toBe(false);
		expect(doDisplayNamesMatch(null, null)).toBe(false);
		expect(doDisplayNamesMatch('Jane Doe', undefined)).toBe(false);
		expect(doDisplayNamesMatch(undefined, 'Jane Doe')).toBe(false);
	});
});
