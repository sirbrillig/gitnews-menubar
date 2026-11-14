/* globals describe, it, expect */
const doesNoteMatchFilter =
	require('../src/renderer/lib/does-note-match-filter').default;

function makeNote({ reason, latestCommentMentionsYou, state, merged } = {}) {
	return {
		id: 'note1',
		latestCommentMentionsYou,
		api: { subject: { state, merged }, notification: { reason } },
	};
}

describe('doesNoteMatchFilter()', function () {
	it('matches every note for the "all" filter', function () {
		expect(
			doesNoteMatchFilter(makeNote({ reason: 'author' }), 'all', false)
		).toBe(true);
	});

	it('matches notes with the same reason as the filter', function () {
		expect(
			doesNoteMatchFilter(makeNote({ reason: 'mention' }), 'mention', false)
		).toBe(true);
		expect(
			doesNoteMatchFilter(makeNote({ reason: 'author' }), 'mention', false)
		).toBe(false);
	});

	it('matches a detected mention for the mention filter when enabled', function () {
		const note = makeNote({
			reason: 'review_requested',
			latestCommentMentionsYou: true,
		});
		expect(doesNoteMatchFilter(note, 'mention', true)).toBe(true);
	});

	it('does not match a detected mention for the mention filter when disabled', function () {
		const note = makeNote({
			reason: 'review_requested',
			latestCommentMentionsYou: true,
		});
		expect(doesNoteMatchFilter(note, 'mention', false)).toBe(false);
	});

	it('does not match a detected mention for other filters', function () {
		const note = makeNote({
			reason: 'review_requested',
			latestCommentMentionsYou: true,
		});
		expect(doesNoteMatchFilter(note, 'team_mention', true)).toBe(false);
	});

	it('does not match a note without a mention for the mention filter', function () {
		const note = makeNote({
			reason: 'author',
			latestCommentMentionsYou: false,
		});
		expect(doesNoteMatchFilter(note, 'mention', true)).toBe(false);
	});

	it('matches closed notes when hideClosed is not set', function () {
		const note = makeNote({ reason: 'author', state: 'closed' });
		expect(doesNoteMatchFilter(note, 'all', false)).toBe(true);
		expect(doesNoteMatchFilter(note, 'all', false, false)).toBe(true);
	});

	it('does not match closed or merged notes when hideClosed is set', function () {
		const closed = makeNote({ reason: 'author', state: 'closed' });
		const merged = makeNote({ reason: 'author', state: 'open', merged: true });
		expect(doesNoteMatchFilter(closed, 'all', false, true)).toBe(false);
		expect(doesNoteMatchFilter(closed, 'author', false, true)).toBe(false);
		expect(doesNoteMatchFilter(merged, 'all', false, true)).toBe(false);
	});

	it('matches open notes and notes without a state when hideClosed is set', function () {
		const open = makeNote({ reason: 'author', state: 'open' });
		const noState = makeNote({ reason: 'ci_activity', state: '' });
		expect(doesNoteMatchFilter(open, 'all', false, true)).toBe(true);
		expect(doesNoteMatchFilter(noState, 'all', false, true)).toBe(true);
	});
});
