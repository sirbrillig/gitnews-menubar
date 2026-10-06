/* globals describe, it */
const {
	getErrorMessage,
	isOfflineCode,
	isNoteLowPriority,
	mergeNotifications,
	LOW_PRIORITY_WINDOW_MS,
} = require('../src/renderer/lib/helpers');

describe('getErrorMessage()', function () {
	it('returns the error if the error is a string', function () {
		expect(getErrorMessage('hello world')).toEqual('hello world');
	});

	it('returns the error code if one is set', function () {
		const err = { code: 'YOYOYO' };
		expect(getErrorMessage(err)).toEqual(err.code);
	});

	it('returns the error status if one is set', function () {
		const err = { status: 'YOYOYO' };
		expect(getErrorMessage(err)).toEqual(err.status);
	});

	it('returns the error statusText if one is set', function () {
		const err = { statusText: 'YOYOYO' };
		expect(getErrorMessage(err)).toEqual(err.statusText);
	});

	it('returns the error message if one is set', function () {
		const err = { message: 'YOYOYO' };
		expect(getErrorMessage(err)).toEqual(err.message);
	});

	it('returns the error status and statusText if set', function () {
		const err = { status: 501, statusText: 'YOYOYO' };
		expect(getErrorMessage(err)).toEqual(`${err.status}; ${err.statusText}`);
	});

	it('returns the error status and statusText and url if set', function () {
		const err = { url: 'http://google.com', status: 501, statusText: 'YOYOYO' };
		expect(getErrorMessage(err)).toEqual(
			`${err.status}; ${err.statusText}; for url ${err.url}`
		);
	});
});

describe('isOfflineCode()', function () {
	it('returns true if the code is ENETDOWN', function () {
		expect(isOfflineCode('ENETDOWN')).toBeTruthy();
	});

	it('returns false if the code is missing', function () {
		expect(isOfflineCode(null)).toBeFalsy();
	});
});

describe('isNoteLowPriority()', function () {
	const dismissedAt = Date.parse('2026-10-01T12:00:00Z');
	const makeNote = (overrides = {}) => ({
		id: 'a1',
		unread: true,
		updatedAt: '2026-10-01T15:00:00Z',
		gitnewsDismissedAt: dismissedAt,
		gitnewsDismissedReason: 'subscribed',
		api: { notification: { reason: 'subscribed' } },
		...overrides,
	});

	it('returns true for an unread note updated soon after being dismissed', function () {
		expect(isNoteLowPriority(makeNote())).toBe(true);
	});

	it('returns false if the note was never dismissed', function () {
		expect(isNoteLowPriority(makeNote({ gitnewsDismissedAt: undefined }))).toBe(
			false
		);
	});

	it('returns false if the note is read', function () {
		expect(isNoteLowPriority(makeNote({ unread: false }))).toBe(false);
	});

	it('returns false if the user marked the note unread', function () {
		expect(isNoteLowPriority(makeNote({ gitnewsMarkedUnread: true }))).toBe(
			false
		);
	});

	it('returns false if the update came after the low priority window', function () {
		const updatedAt = new Date(
			dismissedAt + LOW_PRIORITY_WINDOW_MS + 60_000
		).toISOString();
		expect(isNoteLowPriority(makeNote({ updatedAt }))).toBe(false);
	});

	it('returns false if the update is a new mention', function () {
		expect(
			isNoteLowPriority(
				makeNote({ api: { notification: { reason: 'mention' } } })
			)
		).toBe(false);
	});

	it('returns false if the update is a new team mention', function () {
		expect(
			isNoteLowPriority(
				makeNote({ api: { notification: { reason: 'team_mention' } } })
			)
		).toBe(false);
	});

	it('returns false if a new comment mentions the user', function () {
		expect(
			isNoteLowPriority(
				makeNote({
					gitnewsDismissedReason: 'mention',
					gitnewsDismissedCommentUrl: 'https://github.com/a/b/pull/1#c1',
					commentUrl: 'https://github.com/a/b/pull/1#c2',
					latestCommentMentionsYou: true,
					api: { notification: { reason: 'mention' } },
				})
			)
		).toBe(false);
	});

	it('returns true if the comment that mentions the user is not new', function () {
		expect(
			isNoteLowPriority(
				makeNote({
					gitnewsDismissedReason: 'mention',
					gitnewsDismissedCommentUrl: 'https://github.com/a/b/pull/1#c1',
					commentUrl: 'https://github.com/a/b/pull/1#c1',
					latestCommentMentionsYou: true,
					api: { notification: { reason: 'mention' } },
				})
			)
		).toBe(true);
	});

	it('returns true if the note was already a mention when dismissed', function () {
		expect(
			isNoteLowPriority(
				makeNote({
					gitnewsDismissedReason: 'mention',
					api: { notification: { reason: 'mention' } },
				})
			)
		).toBe(true);
	});
});

describe('mergeNotifications()', function () {
	it('preserves dismissal data when a note has been updated', function () {
		const prevNotes = [
			{
				id: 'a1',
				gitnewsAccountId: 'acc',
				unread: false,
				updatedAt: '2026-10-01T12:00:00Z',
				gitnewsDismissedAt: 1000,
				gitnewsDismissedReason: 'subscribed',
			},
		];
		const nextNotes = [
			{
				id: 'a1',
				gitnewsAccountId: 'acc',
				unread: true,
				updatedAt: '2026-10-01T13:00:00Z',
			},
		];
		const [merged] = mergeNotifications(prevNotes, nextNotes);
		expect(merged.unread).toBe(true);
		expect(merged.gitnewsDismissedAt).toBe(1000);
		expect(merged.gitnewsDismissedReason).toBe('subscribed');
	});
});
