/* globals describe, it, expect */
const doesNoteMatchFilter =
	require('../src/renderer/lib/does-note-match-filter').default;

function makeNote({ reason, latestCommentMentionsYou } = {}) {
	return {
		id: 'note1',
		latestCommentMentionsYou,
		api: { notification: { reason } },
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
});
