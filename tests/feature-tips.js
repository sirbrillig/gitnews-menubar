/* globals describe, it */
const {
	getFeatureTip,
	FEATURE_TIP_COOLDOWN_MS,
} = require('../src/renderer/lib/feature-tips');

const now = Date.parse('2026-10-02T12:00:00Z');

const makeNote = (id, overrides = {}) => ({
	id,
	gitnewsAccountId: 'acc',
	unread: true,
	repositoryFullName: 'owner/repo',
	title: `Note ${id}`,
	updatedAt: '2026-10-01T15:00:00Z',
	api: { notification: { reason: 'subscribed' } },
	...overrides,
});

const makeDismissedNote = (id, overrides = {}) =>
	makeNote(id, {
		gitnewsDismissedAt: Date.parse('2026-10-01T12:00:00Z'),
		gitnewsDismissedReason: 'subscribed',
		...overrides,
	});

const makeState = (overrides = {}) => ({
	isLowPriorityEnabled: false,
	lowPriorityTitlePatterns: {},
	isGroupByRepoEnabled: false,
	dismissedFeatureTips: [],
	lastFeatureTipDismissedAt: false,
	...overrides,
});

describe('getFeatureTip()', function () {
	describe('low priority tip', function () {
		const notes = [makeNote('a1'), makeDismissedNote('a2')];

		it('is shown in a note that was updated soon after being dismissed', function () {
			expect(getFeatureTip(notes, makeState(), { now })).toEqual({
				tipId: 'low-priority',
				note: notes[1],
			});
		});

		it('is not shown if the setting is on', function () {
			expect(
				getFeatureTip(notes, makeState({ isLowPriorityEnabled: true }), {
					now,
				})
			).toBeUndefined();
		});

		it('is not shown if it was dismissed', function () {
			expect(
				getFeatureTip(
					notes,
					makeState({ dismissedFeatureTips: ['low-priority'] }),
					{ now }
				)
			).toBeUndefined();
		});

		it('is shown while confirming even though the setting is on', function () {
			expect(
				getFeatureTip(
					notes,
					makeState({
						isLowPriorityEnabled: true,
						dismissedFeatureTips: ['low-priority'],
						lastFeatureTipDismissedAt: now,
					}),
					{ now, confirmingTipId: 'low-priority' }
				)?.tipId
			).toBe('low-priority');
		});
	});

	describe('group by repo tip', function () {
		const notes = [
			makeNote('a1', { repositoryFullName: 'other/repo' }),
			makeNote('a2'),
			makeNote('a3', { repositoryFullName: 'Owner/Repo' }),
			makeNote('a4'),
		];

		it('is shown in the first note of a repo with enough unread notes', function () {
			expect(getFeatureTip(notes, makeState(), { now })).toEqual({
				tipId: 'group-by-repo',
				note: notes[1],
				count: 3,
			});
		});

		it('is not shown if no repo has enough unread notes', function () {
			expect(
				getFeatureTip(notes.slice(0, 3), makeState(), { now })
			).toBeUndefined();
		});

		it('does not count low priority notes', function () {
			const withLowPriority = [...notes.slice(0, 3), makeDismissedNote('a4')];
			expect(
				getFeatureTip(
					withLowPriority,
					makeState({ isLowPriorityEnabled: true }),
					{ now }
				)
			).toBeUndefined();
		});

		it('is not shown if the setting is on', function () {
			expect(
				getFeatureTip(notes, makeState({ isGroupByRepoEnabled: true }), {
					now,
				})
			).toBeUndefined();
		});

		it('is not shown if it was dismissed', function () {
			expect(
				getFeatureTip(
					notes,
					makeState({ dismissedFeatureTips: ['group-by-repo'] }),
					{ now }
				)
			).toBeUndefined();
		});
	});

	describe('with more than one tip', function () {
		const notes = [
			makeDismissedNote('a1', { repositoryFullName: 'other/repo' }),
			makeNote('a2'),
			makeNote('a3'),
			makeNote('a4'),
		];

		it('shows the low priority tip first', function () {
			expect(getFeatureTip(notes, makeState(), { now })?.tipId).toBe(
				'low-priority'
			);
		});

		it('shows the next tip once the first is dismissed and the cooldown is over', function () {
			const state = makeState({
				dismissedFeatureTips: ['low-priority'],
				lastFeatureTipDismissedAt: now - FEATURE_TIP_COOLDOWN_MS - 1,
			});
			expect(getFeatureTip(notes, state, { now })?.tipId).toBe('group-by-repo');
		});

		it('shows no tip soon after another tip was dismissed', function () {
			const state = makeState({
				dismissedFeatureTips: ['low-priority'],
				lastFeatureTipDismissedAt: now - 60_000,
			});
			expect(getFeatureTip(notes, state, { now })).toBeUndefined();
		});

		it('shows only the confirming tip while confirming', function () {
			const state = makeState({
				isLowPriorityEnabled: true,
				dismissedFeatureTips: ['low-priority'],
				lastFeatureTipDismissedAt: now,
			});
			expect(
				getFeatureTip(notes, state, { now, confirmingTipId: 'low-priority' })
					?.tipId
			).toBe('low-priority');
		});
	});
});
