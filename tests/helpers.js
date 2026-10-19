/* globals describe, it */
const {
	getErrorMessage,
	isOfflineCode,
	isNoteLowPriority,
	getLowPriorityReason,
	getMentionsSinceForNote,
	hasRecentMention,
	mergeNotifications,
	groupNotesByRepo,
	wouldDismissalMakeNoteLowPriority,
	LOW_PRIORITY_WINDOW_MS,
	getLowPriorityOptions,
	getReviewCommentsLabel,
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

	it('returns true for an update over a weekend by default', function () {
		const updatedAt = new Date(dismissedAt + 70 * 60 * 60 * 1000).toISOString();
		expect(isNoteLowPriority(makeNote({ updatedAt }))).toBe(true);
	});

	it('uses a custom low priority window', function () {
		const updatedAt = new Date(dismissedAt + 30 * 60 * 60 * 1000).toISOString();
		const options = (hours) =>
			getLowPriorityOptions({
				isLowPriorityEnabled: true,
				lowPriorityWindowHours: hours,
			});
		expect(isNoteLowPriority(makeNote({ updatedAt }), options(24))).toBe(false);
		expect(isNoteLowPriority(makeNote({ updatedAt }), options(48))).toBe(true);
	});

	it('uses the default window if the setting is missing or invalid', function () {
		const updatedAt = new Date(dismissedAt + 70 * 60 * 60 * 1000).toISOString();
		[undefined, 0, -5, NaN, 'abc'].forEach((hours) => {
			expect(
				isNoteLowPriority(
					makeNote({ updatedAt }),
					getLowPriorityOptions({
						isLowPriorityEnabled: true,
						lowPriorityWindowHours: hours,
					})
				)
			).toBe(true);
		});
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

	it('returns false if a mention was found since the dismissal', function () {
		expect(
			isNoteLowPriority(
				makeNote({
					gitnewsDismissedReason: 'mention',
					mentionFoundSince: dismissedAt,
					api: { notification: { reason: 'mention' } },
				})
			)
		).toBe(false);
	});

	it('returns true if a mention was found since an older dismissal', function () {
		expect(
			isNoteLowPriority(
				makeNote({
					gitnewsDismissedReason: 'mention',
					mentionFoundSince: dismissedAt - 1000,
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

	it('preserves the manual priority when a note has been updated', function () {
		const override = { priority: 'normal', reason: 'subscribed' };
		const prevNotes = [
			{
				id: 'a1',
				gitnewsAccountId: 'acc',
				unread: true,
				updatedAt: '2026-10-01T12:00:00Z',
				gitnewsPriorityOverride: override,
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
		expect(merged.gitnewsPriorityOverride).toEqual(override);
	});

	it('preserves the manual priority when a note has not been updated', function () {
		const override = { priority: 'low', reason: 'subscribed' };
		const note = {
			id: 'a1',
			gitnewsAccountId: 'acc',
			unread: true,
			updatedAt: '2026-10-01T12:00:00Z',
		};
		const [merged] = mergeNotifications(
			[{ ...note, gitnewsPriorityOverride: override }],
			[note]
		);
		expect(merged.gitnewsPriorityOverride).toEqual(override);
	});
});

describe('getMentionsSinceForNote()', function () {
	const dismissedAt = Date.parse('2026-10-01T12:00:00Z');
	const existingNote = {
		id: 'a1',
		unread: false,
		gitnewsDismissedAt: dismissedAt,
		gitnewsDismissedReason: 'mention',
	};
	const enabled = { isDismissalEnabled: true };
	const makeBasicNote = (overrides = {}) => ({
		id: 'a1',
		unread: true,
		reason: 'mention',
		updatedAt: '2026-10-01T15:00:00Z',
		...overrides,
	});

	it('returns the dismissal time for a note that may be low priority', function () {
		expect(
			getMentionsSinceForNote(existingNote, makeBasicNote(), enabled)
		).toBe(dismissedAt);
	});

	it('returns undefined if there is no existing note', function () {
		expect(
			getMentionsSinceForNote(undefined, makeBasicNote(), enabled)
		).toBeUndefined();
	});

	it('returns undefined if the note was not dismissed', function () {
		expect(
			getMentionsSinceForNote(
				{ ...existingNote, gitnewsDismissedAt: undefined },
				makeBasicNote(),
				enabled
			)
		).toBeUndefined();
	});

	it('returns undefined if the note is read', function () {
		expect(
			getMentionsSinceForNote(
				existingNote,
				makeBasicNote({ unread: false }),
				enabled
			)
		).toBeUndefined();
	});

	it('returns undefined if the update is outside the window', function () {
		const updatedAt = new Date(
			dismissedAt + LOW_PRIORITY_WINDOW_MS + 60_000
		).toISOString();
		expect(
			getMentionsSinceForNote(
				existingNote,
				makeBasicNote({ updatedAt }),
				enabled
			)
		).toBeUndefined();
	});

	it('returns undefined if the reason already shows a new mention', function () {
		expect(
			getMentionsSinceForNote(
				{ ...existingNote, gitnewsDismissedReason: 'subscribed' },
				makeBasicNote(),
				enabled
			)
		).toBeUndefined();
	});

	it('returns undefined if dismissal low priority is disabled', function () {
		expect(
			getMentionsSinceForNote(existingNote, makeBasicNote(), {
				isDismissalEnabled: false,
			})
		).toBeUndefined();
	});

	it('returns the dismissal time outside the window if the title matches', function () {
		const updatedAt = new Date(
			dismissedAt + LOW_PRIORITY_WINDOW_MS + 60_000
		).toISOString();
		expect(
			getMentionsSinceForNote(
				existingNote,
				makeBasicNote({
					updatedAt,
					repositoryFullName: 'owner/repo',
					title: 'Bump lodash',
				}),
				{ titlePatterns: { 'owner/repo': ['^bump '] } }
			)
		).toBe(dismissedAt);
	});
});

describe('wouldDismissalMakeNoteLowPriority()', function () {
	const makeNote = (overrides = {}) => ({
		id: 'a1',
		unread: true,
		repositoryFullName: 'Owner/Repo',
		title: 'Fix the thing',
		updatedAt: '2026-10-01T15:00:00Z',
		gitnewsDismissedAt: Date.parse('2026-10-01T12:00:00Z'),
		gitnewsDismissedReason: 'subscribed',
		api: { notification: { reason: 'subscribed' } },
		...overrides,
	});

	it('returns true for a note updated soon after being dismissed', function () {
		expect(wouldDismissalMakeNoteLowPriority(makeNote())).toBe(true);
	});

	it('returns false if the note was never dismissed', function () {
		expect(
			wouldDismissalMakeNoteLowPriority(
				makeNote({ gitnewsDismissedAt: undefined })
			)
		).toBe(false);
	});

	it('returns false if the update is a new mention', function () {
		expect(
			wouldDismissalMakeNoteLowPriority(
				makeNote({ api: { notification: { reason: 'mention' } } })
			)
		).toBe(false);
	});

	it('returns false if the note is already low priority by title', function () {
		expect(
			wouldDismissalMakeNoteLowPriority(makeNote(), {
				'owner/repo': ['^fix '],
			})
		).toBe(false);
	});
});

describe('getLowPriorityReason()', function () {
	const titlePatterns = { 'owner/repo': ['^chore\\(deps\\)', '[invalid'] };
	const makeNote = (overrides = {}) => ({
		id: 'a1',
		unread: true,
		repositoryFullName: 'Owner/Repo',
		title: 'chore(deps): bump lodash',
		updatedAt: '2026-10-01T15:00:00Z',
		api: { notification: { reason: 'subscribed' } },
		...overrides,
	});

	it('returns "title" if the title matches a pattern for the repo', function () {
		expect(getLowPriorityReason(makeNote(), { titlePatterns })).toBe('title');
	});

	it('matches titles regardless of case', function () {
		expect(
			getLowPriorityReason(makeNote({ title: 'CHORE(DEPS): bump' }), {
				titlePatterns,
			})
		).toBe('title');
	});

	it('returns undefined if the title does not match', function () {
		expect(
			getLowPriorityReason(makeNote({ title: 'Fix a bug' }), { titlePatterns })
		).toBeUndefined();
	});

	it('returns undefined for a different repo', function () {
		expect(
			getLowPriorityReason(makeNote({ repositoryFullName: 'other/repo' }), {
				titlePatterns,
			})
		).toBeUndefined();
	});

	it('ignores invalid patterns', function () {
		expect(
			getLowPriorityReason(makeNote({ title: '[invalid' }), { titlePatterns })
		).toBeUndefined();
	});

	it('returns undefined for a read note', function () {
		expect(
			getLowPriorityReason(makeNote({ unread: false }), { titlePatterns })
		).toBeUndefined();
	});

	it('returns undefined if the user was mentioned', function () {
		expect(
			getLowPriorityReason(
				makeNote({ api: { notification: { reason: 'mention' } } }),
				{ titlePatterns }
			)
		).toBeUndefined();
	});

	it('returns undefined if the latest comment mentions the user', function () {
		expect(
			getLowPriorityReason(makeNote({ latestCommentMentionsYou: true }), {
				titlePatterns,
			})
		).toBeUndefined();
	});

	it('returns "title" for an old mention from before the note was dismissed', function () {
		expect(
			getLowPriorityReason(
				makeNote({
					gitnewsDismissedAt: Date.parse('2026-09-01T12:00:00Z'),
					gitnewsDismissedReason: 'mention',
					api: { notification: { reason: 'mention' } },
				}),
				{ titlePatterns }
			)
		).toBe('title');
	});

	it('returns undefined for a new mention after the note was dismissed', function () {
		const dismissedAt = Date.parse('2026-09-01T12:00:00Z');
		expect(
			getLowPriorityReason(
				makeNote({
					gitnewsDismissedAt: dismissedAt,
					gitnewsDismissedReason: 'mention',
					mentionFoundSince: dismissedAt,
					api: { notification: { reason: 'mention' } },
				}),
				{ titlePatterns }
			)
		).toBeUndefined();
	});

	it('returns "dismissed" only if dismissal low priority is enabled', function () {
		const note = makeNote({
			title: 'Fix a bug',
			gitnewsDismissedAt: Date.parse('2026-10-01T12:00:00Z'),
			gitnewsDismissedReason: 'subscribed',
		});
		expect(getLowPriorityReason(note, { isDismissalEnabled: true })).toBe(
			'dismissed'
		);
		expect(getLowPriorityReason(note, { isDismissalEnabled: false })).toBe(
			undefined
		);
	});

	it('returns "manual" if the user marked the note low priority', function () {
		const note = makeNote({
			title: 'Fix a bug',
			gitnewsPriorityOverride: { priority: 'low', reason: 'subscribed' },
		});
		expect(getLowPriorityReason(note, { titlePatterns })).toBe('manual');
	});

	it('returns "manual" for a note marked unread then marked low priority', function () {
		const note = makeNote({
			title: 'Fix a bug',
			unread: false,
			gitnewsMarkedUnread: true,
			gitnewsPriorityOverride: { priority: 'low', reason: 'subscribed' },
		});
		expect(getLowPriorityReason(note, { titlePatterns })).toBe('manual');
	});

	it('returns undefined for a manual low priority note that is read', function () {
		const note = makeNote({
			unread: false,
			gitnewsPriorityOverride: { priority: 'low', reason: 'subscribed' },
		});
		expect(getLowPriorityReason(note, { titlePatterns })).toBeUndefined();
	});

	it('returns "manual" for a thread that was already a mention', function () {
		const note = makeNote({
			commentUrl: 'https://example.com/comment/1',
			latestCommentMentionsYou: true,
			api: { notification: { reason: 'mention' } },
			gitnewsPriorityOverride: {
				priority: 'low',
				reason: 'mention',
				commentUrl: 'https://example.com/comment/1',
			},
		});
		expect(getLowPriorityReason(note, { titlePatterns })).toBe('manual');
	});

	it('returns undefined for a manual low priority note with a new mention', function () {
		const override = {
			priority: 'low',
			reason: 'subscribed',
			commentUrl: 'https://example.com/comment/1',
		};
		expect(
			getLowPriorityReason(
				makeNote({
					api: { notification: { reason: 'mention' } },
					gitnewsPriorityOverride: override,
				}),
				{ titlePatterns }
			)
		).toBeUndefined();
		expect(
			getLowPriorityReason(
				makeNote({
					commentUrl: 'https://example.com/comment/2',
					latestCommentMentionsYou: true,
					gitnewsPriorityOverride: override,
				}),
				{ titlePatterns }
			)
		).toBeUndefined();
	});

	it('returns undefined if the user removed low priority from a matching title', function () {
		const note = makeNote({ gitnewsPriorityOverride: { priority: 'normal' } });
		expect(getLowPriorityReason(note, { titlePatterns })).toBeUndefined();
	});

	it('returns undefined if the user removed low priority from a dismissed note', function () {
		const note = makeNote({
			title: 'Fix a bug',
			gitnewsDismissedAt: Date.parse('2026-10-01T12:00:00Z'),
			gitnewsDismissedReason: 'subscribed',
			gitnewsPriorityOverride: { priority: 'normal' },
		});
		expect(
			getLowPriorityReason(note, { isDismissalEnabled: true })
		).toBeUndefined();
	});
});

describe('getLowPriorityReason() with comment patterns', function () {
	const commentPatterns = { 'owner/repo': ['^coverage report', '[invalid'] };
	const makeNote = (overrides = {}) => ({
		id: 'a1',
		unread: true,
		repositoryFullName: 'Owner/Repo',
		title: 'Fix a bug',
		updatedAt: '2026-10-01T15:00:00Z',
		commentUrl: 'https://example.com/comment/1',
		commentExcerpt: 'Coverage report: 92% of lines covered',
		api: { notification: { reason: 'subscribed' } },
		...overrides,
	});

	it('returns "comment" if the latest comment matches a pattern for the repo', function () {
		expect(getLowPriorityReason(makeNote(), { commentPatterns })).toBe(
			'comment'
		);
	});

	it('returns undefined once a later comment does not match', function () {
		expect(
			getLowPriorityReason(
				makeNote({
					commentUrl: 'https://example.com/comment/2',
					commentExcerpt: 'Can you take another look?',
				}),
				{ commentPatterns }
			)
		).toBeUndefined();
	});

	it('returns undefined if the note has no comment text', function () {
		expect(
			getLowPriorityReason(makeNote({ commentExcerpt: undefined }), {
				commentPatterns,
			})
		).toBeUndefined();
	});

	it('returns undefined for a different repo', function () {
		expect(
			getLowPriorityReason(makeNote({ repositoryFullName: 'other/repo' }), {
				commentPatterns,
			})
		).toBeUndefined();
	});

	it('ignores invalid patterns', function () {
		expect(
			getLowPriorityReason(makeNote({ commentExcerpt: '[invalid' }), {
				commentPatterns,
			})
		).toBeUndefined();
	});

	it('does not match the title against comment patterns', function () {
		expect(
			getLowPriorityReason(
				makeNote({ title: 'Coverage report', commentExcerpt: 'Looks good' }),
				{ commentPatterns }
			)
		).toBeUndefined();
	});

	it('returns undefined if the latest comment mentions the user', function () {
		expect(
			getLowPriorityReason(makeNote({ latestCommentMentionsYou: true }), {
				commentPatterns,
			})
		).toBeUndefined();
	});

	it('returns undefined if the user removed low priority from the note', function () {
		expect(
			getLowPriorityReason(
				makeNote({ gitnewsPriorityOverride: { priority: 'normal' } }),
				{ commentPatterns }
			)
		).toBeUndefined();
	});
});

describe('hasRecentMention()', function () {
	const dismissedAt = Date.parse('2026-09-01T12:00:00Z');
	const makeNote = (overrides = {}) => ({
		id: 'a1',
		unread: true,
		commentUrl: 'https://example.com/comment/2',
		api: { notification: { reason: 'mention' } },
		...overrides,
	});

	it('returns true if the latest comment mentions the user', function () {
		expect(hasRecentMention(makeNote({ latestCommentMentionsYou: true }))).toBe(
			true
		);
	});

	it('returns false if the user was only mentioned earlier in the thread', function () {
		expect(hasRecentMention(makeNote())).toBe(false);
	});

	it('returns true if a mention was found since the dismissal', function () {
		expect(
			hasRecentMention(
				makeNote({
					gitnewsDismissedAt: dismissedAt,
					gitnewsDismissedReason: 'mention',
					mentionFoundSince: dismissedAt,
				})
			)
		).toBe(true);
	});

	it('returns true if the reason became a mention after the dismissal', function () {
		expect(
			hasRecentMention(
				makeNote({
					gitnewsDismissedAt: dismissedAt,
					gitnewsDismissedReason: 'subscribed',
				})
			)
		).toBe(true);
	});

	it('returns false if the mentioning comment was already dismissed', function () {
		expect(
			hasRecentMention(
				makeNote({
					gitnewsDismissedAt: dismissedAt,
					gitnewsDismissedReason: 'mention',
					gitnewsDismissedCommentUrl: 'https://example.com/comment/2',
					latestCommentMentionsYou: true,
				})
			)
		).toBe(false);
	});
});

describe('groupNotesByRepo()', function () {
	const makeNote = (id, repositoryFullName) => ({ id, repositoryFullName });

	it('returns no groups for no notes', function () {
		expect(groupNotesByRepo([])).toEqual([]);
	});

	it('orders groups alphabetically by repo and keeps note order', function () {
		const notes = [
			makeNote('1', 'b/two'),
			makeNote('2', 'A/three'),
			makeNote('3', 'a/one'),
			makeNote('4', 'b/two'),
			makeNote('5', 'a/one'),
		];
		const groups = groupNotesByRepo(notes);
		expect(groups.map((group) => group.repositoryFullName)).toEqual([
			'a/one',
			'A/three',
			'b/two',
		]);
		expect(groups[0].notes.map((note) => note.id)).toEqual(['3', '5']);
		expect(groups[1].notes.map((note) => note.id)).toEqual(['2']);
		expect(groups[2].notes.map((note) => note.id)).toEqual(['1', '4']);
	});

	it('groups repos regardless of case', function () {
		const groups = groupNotesByRepo([
			makeNote('1', 'Owner/Repo'),
			makeNote('2', 'owner/repo'),
		]);
		expect(groups).toHaveLength(1);
		expect(groups[0].repositoryFullName).toBe('Owner/Repo');
	});
});

describe('getReviewCommentsLabel()', function () {
	function makeReviewComments(overrides = {}) {
		return { count: 1, isReply: false, isReplyToYou: false, ...overrides };
	}

	it('returns undefined for a note without review comments', function () {
		expect(getReviewCommentsLabel({})).toBeUndefined();
	});

	it('describes a reply to your review comment', function () {
		expect(
			getReviewCommentsLabel({
				reviewComments: makeReviewComments({
					isReply: true,
					isReplyToYou: true,
				}),
			})
		).toEqual('Replied to your review comment');
	});

	it('describes a reply to someone else', function () {
		expect(
			getReviewCommentsLabel({
				reviewComments: makeReviewComments({ isReply: true }),
			})
		).toEqual('Replied to a review comment');
	});

	it('describes a single new review comment', function () {
		expect(
			getReviewCommentsLabel({ reviewComments: makeReviewComments() })
		).toEqual('Left a review comment');
	});

	it('describes several review comments', function () {
		expect(
			getReviewCommentsLabel({
				reviewComments: makeReviewComments({ count: 3, isReply: true }),
			})
		).toEqual('Left 3 review comments');
	});
});
