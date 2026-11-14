/* globals describe, it, expect */
const { getActiveFilters } = require('../src/renderer/lib/active-filters');

describe('getActiveFilters()', function () {
	it('returns nothing when no filters are on', function () {
		expect(
			getActiveFilters({
				filterType: 'all',
				hideClosed: false,
				hideLowPriority: false,
			})
		).toEqual([]);
	});

	it('returns every active filter in menu order', function () {
		expect(
			getActiveFilters({
				filterType: 'mention',
				hideClosed: true,
				hideLowPriority: true,
			})
		).toEqual([
			{ id: 'reason', label: 'Mentioned' },
			{ id: 'hide-closed', label: 'Hide closed' },
			{ id: 'hide-low-priority', label: 'Hide low priority' },
		]);
	});

	it('treats missing toggles as off', function () {
		expect(getActiveFilters({ filterType: 'author' })).toEqual([
			{ id: 'reason', label: 'Author' },
		]);
	});
});
