/* globals describe, it, beforeEach */
const { createReducer } = require('../src/renderer/lib/reducer');
const { secsToMs } = require('../src/renderer/lib/helpers');

const reducer = createReducer('');

describe('reducer', function () {
	describe('CLEAR_ERRORS', function () {
		it('empties all errors', function () {
			const action = { type: 'CLEAR_ERRORS' };
			const result = reducer({ errors: ['an error'] }, action);
			expect(result.errors).toEqual([]);
		});
	});

	describe('SET_LOW_PRIORITY_ENABLED', function () {
		it('is disabled by default', function () {
			const result = reducer(undefined, { type: 'UNKNOWN' });
			expect(result.isLowPriorityEnabled).toBe(false);
		});

		it('changes the setting', function () {
			const action = { type: 'SET_LOW_PRIORITY_ENABLED', isEnabled: true };
			const result = reducer({ isLowPriorityEnabled: false }, action);
			expect(result.isLowPriorityEnabled).toBe(true);
		});
	});

	describe('SET_GROUP_BY_REPO_ENABLED', function () {
		it('is disabled by default', function () {
			const result = reducer(undefined, { type: 'UNKNOWN' });
			expect(result.isGroupByRepoEnabled).toBe(false);
		});

		it('changes the setting', function () {
			const action = { type: 'SET_GROUP_BY_REPO_ENABLED', isEnabled: true };
			const result = reducer({ isGroupByRepoEnabled: false }, action);
			expect(result.isGroupByRepoEnabled).toBe(true);
		});
	});

	describe('SET_LOW_PRIORITY_TITLE_PATTERNS', function () {
		it('has no patterns by default', function () {
			const result = reducer(undefined, { type: 'UNKNOWN' });
			expect(result.lowPriorityTitlePatterns).toEqual({});
		});

		it('sets the patterns for a repo using a lowercase name', function () {
			const action = {
				type: 'SET_LOW_PRIORITY_TITLE_PATTERNS',
				repo: ' Owner/Repo ',
				patterns: ['^Bump ', ''],
			};
			const result = reducer({ lowPriorityTitlePatterns: {} }, action);
			expect(result.lowPriorityTitlePatterns).toEqual({
				'owner/repo': ['^Bump '],
			});
		});

		it('does not affect other repos', function () {
			const action = {
				type: 'SET_LOW_PRIORITY_TITLE_PATTERNS',
				repo: 'owner/repo',
				patterns: ['b'],
			};
			const result = reducer(
				{
					lowPriorityTitlePatterns: {
						'owner/repo': ['a'],
						'other/repo': ['c'],
					},
				},
				action
			);
			expect(result.lowPriorityTitlePatterns).toEqual({
				'owner/repo': ['b'],
				'other/repo': ['c'],
			});
		});

		it('removes a repo with no patterns', function () {
			const action = {
				type: 'SET_LOW_PRIORITY_TITLE_PATTERNS',
				repo: 'owner/repo',
				patterns: [],
			};
			const result = reducer(
				{ lowPriorityTitlePatterns: { 'owner/repo': ['a'] } },
				action
			);
			expect(result.lowPriorityTitlePatterns).toEqual({});
		});
	});

	describe('MARK_NOTE_READ', function () {
		it('marks the note as read', function () {
			const notes = [
				{ id: 'a1', unread: true, title: 'test note 1' },
				{ id: 'a2', unread: false, title: 'test note 2' },
				{ id: 'a3', unread: true, title: 'test note 3' },
			];
			const action = { type: 'MARK_NOTE_READ', note: notes[0] };
			const result = reducer({ notes }, action);
			expect(result.notes[0].unread).toBe(false);
		});

		it('does not affect other notes', function () {
			const notes = [
				{ id: 'a1', unread: true, title: 'test note 1' },
				{ id: 'a2', unread: false, title: 'test note 2' },
				{ id: 'a3', unread: true, title: 'test note 3' },
			];
			const action = { type: 'MARK_NOTE_READ', note: notes[0] };
			const result = reducer({ notes }, action);
			expect(result.notes[1].unread).toBe(false);
			expect(result.notes[2].unread).toBe(true);
		});

		it('records dismissal when marked read without opening', function () {
			const notes = [
				{
					id: 'a1',
					unread: true,
					title: 'test note 1',
					api: { notification: { reason: 'subscribed' } },
				},
			];
			const action = {
				type: 'MARK_NOTE_READ',
				note: notes[0],
				source: 'dismiss',
			};
			const result = reducer({ notes }, action);
			expect(result.notes[0].gitnewsDismissedAt).toEqual(expect.any(Number));
			expect(result.notes[0].gitnewsDismissedReason).toBe('subscribed');
		});

		it('clears dismissal when the note is opened', function () {
			const notes = [
				{
					id: 'a1',
					unread: true,
					title: 'test note 1',
					gitnewsDismissedAt: 1000,
					gitnewsDismissedReason: 'subscribed',
					api: { notification: { reason: 'subscribed' } },
				},
			];
			const action = { type: 'MARK_NOTE_READ', note: notes[0] };
			const result = reducer({ notes }, action);
			expect(result.notes[0].gitnewsDismissedAt).toBeUndefined();
			expect(result.notes[0].gitnewsDismissedReason).toBeUndefined();
		});
	});

	describe('NOTES_RETRIEVED', function () {
		const now = '2017-08-23T18:20:00Z';
		let notes = [];

		beforeEach(function () {
			notes = [
				{ id: 'a1', unread: true, title: 'test note 1', updatedAt: now },
				{ id: 'a2', unread: false, title: 'test note 2', updatedAt: now },
				{ id: 'a3', unread: true, title: 'test note 3', updatedAt: now },
			];
		});

		it('disables offline mode', function () {
			const action = { type: 'NOTES_RETRIEVED', notes };
			const result = reducer({ notes: [], offline: true }, action);
			expect(result.offline).toBe(false);
		});

		it('sets lastChecked date', function () {
			const action = { type: 'NOTES_RETRIEVED', notes };
			const result = reducer({ notes: [] }, action);
			expect(result.lastChecked).toBeTruthy();
		});

		it('sets lastSuccessfulCheck date', function () {
			const action = { type: 'NOTES_RETRIEVED', notes };
			const result = reducer({ notes: [] }, action);
			expect(result.lastSuccessfulCheck).toBeTruthy();
		});

		it('resets fetchRetryCount to 0', function () {
			const action = { type: 'NOTES_RETRIEVED', notes };
			const result = reducer({ notes: [], fetchRetryCount: 11 }, action);
			expect(result.fetchRetryCount).toEqual(0);
		});

		it('clears errors', function () {
			const action = { type: 'NOTES_RETRIEVED', notes };
			const result = reducer({ notes: [], errors: ['a1', 'a2'] }, action);
			expect(result.errors).toEqual([]);
		});

		it('changes fetchInterval to the default', function () {
			const action = { type: 'NOTES_RETRIEVED', notes };
			const result = reducer({ notes: [], fetchInterval: 9999 }, action);
			expect(result.fetchInterval).not.toEqual(9999);
		});

		it('saves new notifications', function () {
			const action = { type: 'NOTES_RETRIEVED', notes };
			const result = reducer({ notes: [] }, action);
			expect(result.notes).toHaveLength(3);
		});

		it('removes notifications not in new data', function () {
			const action = { type: 'NOTES_RETRIEVED', notes };
			const result = reducer(
				{ notes: [{ id: 'o1', title: 'test note' }] },
				action
			);
			expect(result.notes.map((note) => note.id)).not.toEqual([
				expect.arrayContaining('o1'),
			]);
		});

		it('preserves `markedUnread` state for existing notifications', function () {
			const action = { type: 'NOTES_RETRIEVED', notes };
			const result = reducer(
				{
					notes: [{ id: 'a1', title: 'test note', gitnewsMarkedUnread: true }],
				},
				action
			);
			expect(
				result.notes.filter((note) => note.gitnewsMarkedUnread)
			).toHaveLength(1);
		});

		it('preserves `seen` state for existing notifications', function () {
			const action = { type: 'NOTES_RETRIEVED', notes };
			const result = reducer(
				{ notes: [{ id: 'a1', title: 'test note', gitnewsSeen: true }] },
				action
			);
			expect(result.notes.filter((note) => note.gitnewsSeen)).toHaveLength(1);
		});

		it('preserves `unread: false` state when notification was marked as read locally', function () {
			const action = { type: 'NOTES_RETRIEVED', notes };
			const result = reducer(
				{
					notes: [
						{
							id: 'a1',
							title: 'test note',
							unread: false,
							updatedAt: now,
							gitnewsSeenAt: Date.now(),
						},
					],
				},
				action
			);
			expect(result.notes[0].unread).toBe(false);
		});

		it('does not preserve `unread: false` when notification updatedAt timestamp changes', function () {
			const olderTime = '2017-08-23T17:20:00Z';
			const newerTime = '2017-08-23T18:20:00Z';
			const action = {
				type: 'NOTES_RETRIEVED',
				notes: [
					{
						id: 'a1',
						unread: true,
						title: 'test note 1',
						updatedAt: newerTime,
					},
				],
			};
			const result = reducer(
				{
					notes: [
						{
							id: 'a1',
							title: 'test note',
							unread: false,
							updatedAt: olderTime,
							gitnewsSeenAt: Date.now(),
						},
					],
				},
				action
			);
			expect(result.notes[0].unread).toBe(true);
		});

		it('replaces `seen` state for existing notifications with updates', function () {
			const longAgo = '2017-08-01T18:20:00Z';
			const action = { type: 'NOTES_RETRIEVED', notes };
			const result = reducer(
				{
					notes: [
						{
							id: 'a1',
							title: 'test note',
							gitnewsSeen: true,
							updatedAt: longAgo,
							gitnewsSeenAt: new Date(longAgo).getTime(),
						},
					],
				},
				action
			);
			expect(result.notes.filter((note) => note.gitnewsSeen)).toHaveLength(0);
		});
	});

	describe('OFFLINE', function () {
		it('sets offline to true', function () {
			const action = { type: 'OFFLINE' };
			const result = reducer({ offline: false }, action);
			expect(result.offline).toBe(true);
		});

		it('sets lastChecked date', function () {
			const action = { type: 'OFFLINE' };
			const result = reducer({ offline: false }, action);
			expect(result.lastChecked).toBeTruthy();
		});

		it('does not set lastSuccessfulCheck date', function () {
			const action = { type: 'OFFLINE' };
			const result = reducer({ offline: false }, action);
			expect(result.lastSuccessfulCheck).toBeFalsy();
		});

		it('sets fetchInterval to 60 secs', function () {
			const action = { type: 'OFFLINE' };
			const result = reducer({ offline: false, fetchRetryCount: 0 }, action);
			expect(result.fetchInterval).toEqual(secsToMs(60));
		});

		it('increases fetchRetryCount by 1', function () {
			const action = { type: 'OFFLINE' };
			const result = reducer({ offline: false, fetchRetryCount: 4 }, action);
			expect(result.fetchRetryCount).toEqual(5);
		});

		it('sets fetchInterval to 60 seconds multiplied by number of tries', function () {
			const action = { type: 'OFFLINE' };
			const result = reducer({ offline: false, fetchRetryCount: 2 }, action);
			expect(result.fetchInterval).toEqual(secsToMs(180));
		});
	});

	describe('ADD_CONNECTION_ERROR', function () {
		it('adds the error string to the list of errors', function () {
			const action = { type: 'ADD_CONNECTION_ERROR', error: 'foobar' };
			const result = reducer({ errors: ['barfoo'] }, action);
			expect(result.errors).toEqual(['barfoo', 'foobar']);
		});

		it('sets lastChecked date', function () {
			const action = { type: 'ADD_CONNECTION_ERROR', error: 'foobar' };
			const result = reducer({ errors: ['barfoo'] }, action);
			expect(result.lastChecked).toBeTruthy();
		});
	});
	describe('UNSUBSCRIBE_NOTE', function () {
		const notes = [
			{ id: 'a1', gitnewsAccountId: 'acc', title: 'test note 1' },
			{ id: 'a2', gitnewsAccountId: 'acc', title: 'test note 2' },
		];

		it('removes the note', function () {
			const action = { type: 'UNSUBSCRIBE_NOTE', note: notes[0] };
			const result = reducer({ notes }, action);
			expect(result.notes).toEqual([notes[1]]);
		});

		it('remembers the note as recently unsubscribed', function () {
			const action = { type: 'UNSUBSCRIBE_NOTE', note: notes[0] };
			const result = reducer({ notes }, action);
			expect(result.recentlyUnsubscribed).toHaveLength(1);
			expect(result.recentlyUnsubscribed[0].note).toBe(notes[0]);
			expect(typeof result.recentlyUnsubscribed[0].unsubscribedAt).toBe(
				'number'
			);
		});

		it('does not duplicate a note unsubscribed twice', function () {
			const action = { type: 'UNSUBSCRIBE_NOTE', note: notes[0] };
			const result = reducer(reducer({ notes }, action), action);
			expect(result.recentlyUnsubscribed).toHaveLength(1);
		});
	});

	describe('DISMISS_UNSUBSCRIBED_NOTICE', function () {
		it('removes only the matching recently unsubscribed note', function () {
			const note1 = { id: 'a1', gitnewsAccountId: 'acc' };
			const note2 = { id: 'a2', gitnewsAccountId: 'acc' };
			let state = reducer(
				{ notes: [note1, note2] },
				{ type: 'UNSUBSCRIBE_NOTE', note: note1 }
			);
			state = reducer(state, { type: 'UNSUBSCRIBE_NOTE', note: note2 });
			const result = reducer(state, {
				type: 'DISMISS_UNSUBSCRIBED_NOTICE',
				noteId: 'gh_acc:acc-__-gh_id:a1',
			});
			expect(result.recentlyUnsubscribed.map((item) => item.note)).toEqual([
				note2,
			]);
		});
	});
});
