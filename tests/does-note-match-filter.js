/* globals describe, it, expect */
const doesNoteMatchFilter =
	require('../src/renderer/lib/does-note-match-filter').default;

function makeNote({
	reason,
	latestCommentMentionsYou,
	state,
	merged,
	unread = true,
	gitnewsPriorityOverride,
} = {}) {
	return {
		id: 'note1',
		unread,
		latestCommentMentionsYou,
		gitnewsPriorityOverride,
		api: { subject: { state, merged }, notification: { reason } },
	};
}

const lowPriorityOverride = { priority: 'low' };

describe('doesNoteMatchFilter()', function () {
	it('matches every note for the "all" filter', function () {
		expect(
			doesNoteMatchFilter(makeNote({ reason: 'author' }), { filterType: 'all' })
		).toBe(true);
	});

	it('matches notes with the same reason as the filter', function () {
		expect(
			doesNoteMatchFilter(makeNote({ reason: 'mention' }), {
				filterType: 'mention',
			})
		).toBe(true);
		expect(
			doesNoteMatchFilter(makeNote({ reason: 'author' }), {
				filterType: 'mention',
			})
		).toBe(false);
	});

	it('matches a detected mention for the mention filter when enabled', function () {
		const note = makeNote({
			reason: 'review_requested',
			latestCommentMentionsYou: true,
		});
		expect(
			doesNoteMatchFilter(note, {
				filterType: 'mention',
				includeDetectedMentions: true,
			})
		).toBe(true);
	});

	it('does not match a detected mention for the mention filter when disabled', function () {
		const note = makeNote({
			reason: 'review_requested',
			latestCommentMentionsYou: true,
		});
		expect(doesNoteMatchFilter(note, { filterType: 'mention' })).toBe(false);
	});

	it('does not match a detected mention for other filters', function () {
		const note = makeNote({
			reason: 'review_requested',
			latestCommentMentionsYou: true,
		});
		expect(
			doesNoteMatchFilter(note, {
				filterType: 'team_mention',
				includeDetectedMentions: true,
			})
		).toBe(false);
	});

	it('does not match a note without a mention for the mention filter', function () {
		const note = makeNote({
			reason: 'author',
			latestCommentMentionsYou: false,
		});
		expect(
			doesNoteMatchFilter(note, {
				filterType: 'mention',
				includeDetectedMentions: true,
			})
		).toBe(false);
	});

	it('matches closed notes when hideClosed is not set', function () {
		const note = makeNote({ reason: 'author', state: 'closed' });
		expect(doesNoteMatchFilter(note, { filterType: 'all' })).toBe(true);
		expect(doesNoteMatchFilter(note, { filterType: 'all' })).toBe(true);
	});

	it('does not match closed or merged notes when hideClosed is set', function () {
		const closed = makeNote({ reason: 'author', state: 'closed' });
		const merged = makeNote({ reason: 'author', state: 'open', merged: true });
		expect(
			doesNoteMatchFilter(closed, { filterType: 'all', hideClosed: true })
		).toBe(false);
		expect(
			doesNoteMatchFilter(closed, { filterType: 'author', hideClosed: true })
		).toBe(false);
		expect(
			doesNoteMatchFilter(merged, { filterType: 'all', hideClosed: true })
		).toBe(false);
	});

	it('matches open notes and notes without a state when hideClosed is set', function () {
		const open = makeNote({ reason: 'author', state: 'open' });
		const noState = makeNote({ reason: 'ci_activity', state: '' });
		expect(
			doesNoteMatchFilter(open, { filterType: 'all', hideClosed: true })
		).toBe(true);
		expect(
			doesNoteMatchFilter(noState, { filterType: 'all', hideClosed: true })
		).toBe(true);
	});

	it('matches low priority notes when hideLowPriority is not set', function () {
		const note = makeNote({ gitnewsPriorityOverride: lowPriorityOverride });
		expect(doesNoteMatchFilter(note, { filterType: 'all' })).toBe(true);
	});

	it('does not match low priority notes when hideLowPriority is set', function () {
		const note = makeNote({
			reason: 'author',
			gitnewsPriorityOverride: lowPriorityOverride,
		});
		const filter = {
			hideLowPriority: true,
			lowPriorityOptions: { isDismissalEnabled: false },
		};
		expect(doesNoteMatchFilter(note, { ...filter, filterType: 'all' })).toBe(
			false
		);
		expect(doesNoteMatchFilter(note, { ...filter, filterType: 'author' })).toBe(
			false
		);
	});

	it('matches normal priority and read notes when hideLowPriority is set', function () {
		const filter = {
			filterType: 'all',
			hideLowPriority: true,
			lowPriorityOptions: { isDismissalEnabled: false },
		};
		expect(doesNoteMatchFilter(makeNote(), filter)).toBe(true);
		const readNote = makeNote({
			unread: false,
			gitnewsPriorityOverride: lowPriorityOverride,
		});
		expect(doesNoteMatchFilter(readNote, filter)).toBe(true);
	});
});
