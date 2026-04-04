/* globals describe, it, beforeEach */
const { createFetcher } = require('../src/renderer/lib/gitnews-fetcher');

// Flush all pending microtasks and macrotasks so async middleware completes
const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

window.electronApi = {
	quitApp: () => undefined,
	logMessage: () => undefined,
	toggleAutoLaunch: () => undefined,
	openUrl: () => undefined,
	setIcon: () => undefined,
	onHide: () => undefined,
	onShow: () => undefined,
	onClick: () => undefined,
	getToken: () => Promise.resolve(''),
	getVersion: () => Promise.resolve('v1'),
	isDemoMode: () => Promise.resolve(false),
	isAutoLaunchEnabled: () => Promise.resolve(false),
	listBasicNotificationsForAccount: jest.fn().mockResolvedValue([]),
	enrichNotificationsForAccount: jest.fn().mockResolvedValue([]),
};

const TEST_ACCOUNT = {
	id: 'acc1',
	name: 'Test Account',
	apiKey: 'test-key',
	serverUrl: 'https://api.github.com',
};

function makeState(overrides = {}) {
	return {
		accounts: [TEST_ACCOUNT],
		mutedRepos: [],
		filterType: 'all',
		fetchingInProgress: false,
		fetchingStartedAt: false,
		isDemoMode: false,
		locallyUnreadNotes: [],
		notes: [],
		...overrides,
	};
}

function makeBasicNote(overrides = {}) {
	return {
		id: 'note1',
		url: 'https://api.github.com/notifications/threads/1',
		repositoryFullName: 'owner/repo',
		repositoryName: 'repo',
		repositoryOwnerAvatar: 'https://example.com/avatar.png',
		reason: 'mention',
		unread: true,
		updatedAt: '2024-01-01T00:00:00Z',
		title: 'Test Note',
		type: 'Issue',
		subjectUrl: 'https://api.github.com/repos/owner/repo/issues/1',
		latestCommentUrl:
			'https://api.github.com/repos/owner/repo/issues/comments/1',
		gitnewsAccountId: 'acc1',
		...overrides,
	};
}

function makeHydratedNote(basicNote, overrides = {}) {
	return {
		...basicNote,
		commentUrl: 'https://github.com/owner/repo/issues/1#comment-1',
		subjectUrl: 'https://github.com/owner/repo/issues/1',
		commentUsername: 'hydrateduser',
		commentAvatar: 'https://example.com/avatar.png',
		api: {
			subject: { state: 'open', merged: false, draft: false },
			notification: { reason: basicNote.reason },
		},
		...overrides,
	};
}

// Create middleware and return a dispatch function + the next spy
function makeMiddleware(state) {
	let currentState = state;
	const next = jest.fn((action) => {
		// Simulate Redux updating state when SET_FILTER_TYPE is forwarded,
		// so performFetch reads the new filterType from store.getState()
		if (action.type === 'SET_FILTER_TYPE') {
			currentState = { ...currentState, filterType: action.filterType };
		}
	});
	const store = { getState: () => currentState };
	const dispatch = createFetcher()(store)(next);
	return { dispatch, next };
}

describe('createFetcher() — two-phase fetch', function () {
	beforeEach(function () {
		window.electronApi.listBasicNotificationsForAccount = jest
			.fn()
			.mockResolvedValue([]);
		window.electronApi.enrichNotificationsForAccount = jest
			.fn()
			.mockResolvedValue([]);
	});

	describe('Phase 1 — list', function () {
		it('calls listBasicNotificationsForAccount once per account', async function () {
			const accounts = [
				TEST_ACCOUNT,
				{ id: 'acc2', name: 'Account 2', apiKey: 'key2', serverUrl: 'https://api.github.com' },
			];
			const { dispatch } = makeMiddleware(makeState({ accounts }));
			dispatch({ type: 'GITNEWS_FETCH_NOTIFICATIONS' });
			await flushPromises();
			expect(
				window.electronApi.listBasicNotificationsForAccount
			).toHaveBeenCalledTimes(2);
			expect(
				window.electronApi.listBasicNotificationsForAccount
			).toHaveBeenCalledWith(accounts[0]);
			expect(
				window.electronApi.listBasicNotificationsForAccount
			).toHaveBeenCalledWith(accounts[1]);
		});
	});

	describe('Phase 2 — filter', function () {
		it('passes unfiltered notes to enrichment', async function () {
			const note = makeBasicNote();
			window.electronApi.listBasicNotificationsForAccount.mockResolvedValue([
				note,
			]);
			const { dispatch } = makeMiddleware(makeState());
			dispatch({ type: 'GITNEWS_FETCH_NOTIFICATIONS' });
			await flushPromises();
			expect(
				window.electronApi.enrichNotificationsForAccount
			).toHaveBeenCalledWith(TEST_ACCOUNT, [note]);
		});

		it('excludes notes from muted repos before enrichment', async function () {
			const mutedNote = makeBasicNote({
				id: 'muted',
				repositoryFullName: 'owner/muted-repo',
			});
			const normalNote = makeBasicNote({
				id: 'normal',
				repositoryFullName: 'owner/good-repo',
			});
			window.electronApi.listBasicNotificationsForAccount.mockResolvedValue([
				mutedNote,
				normalNote,
			]);
			const state = makeState({ mutedRepos: ['owner/muted-repo'] });
			const { dispatch } = makeMiddleware(state);
			dispatch({ type: 'GITNEWS_FETCH_NOTIFICATIONS' });
			await flushPromises();
			expect(
				window.electronApi.enrichNotificationsForAccount
			).toHaveBeenCalledWith(TEST_ACCOUNT, [normalNote]);
		});

		it('excludes notes whose reason does not match filterType', async function () {
			const mentionNote = makeBasicNote({ id: 'n1', reason: 'mention' });
			const subscribedNote = makeBasicNote({ id: 'n2', reason: 'subscribed' });
			window.electronApi.listBasicNotificationsForAccount.mockResolvedValue([
				mentionNote,
				subscribedNote,
			]);
			const state = makeState({ filterType: 'mention' });
			const { dispatch } = makeMiddleware(state);
			dispatch({ type: 'GITNEWS_FETCH_NOTIFICATIONS' });
			await flushPromises();
			expect(
				window.electronApi.enrichNotificationsForAccount
			).toHaveBeenCalledWith(TEST_ACCOUNT, [mentionNote]);
		});

		it('passes all notes when filterType is "all"', async function () {
			const mentionNote = makeBasicNote({ id: 'n1', reason: 'mention' });
			const subscribedNote = makeBasicNote({ id: 'n2', reason: 'subscribed' });
			window.electronApi.listBasicNotificationsForAccount.mockResolvedValue([
				mentionNote,
				subscribedNote,
			]);
			const state = makeState({ filterType: 'all' });
			const { dispatch } = makeMiddleware(state);
			dispatch({ type: 'GITNEWS_FETCH_NOTIFICATIONS' });
			await flushPromises();
			expect(
				window.electronApi.enrichNotificationsForAccount
			).toHaveBeenCalledWith(
				TEST_ACCOUNT,
				expect.arrayContaining([mentionNote, subscribedNote])
			);
		});

		it('does not call enrichNotificationsForAccount when all notes are filtered out', async function () {
			const mutedNote = makeBasicNote({ repositoryFullName: 'owner/muted' });
			window.electronApi.listBasicNotificationsForAccount.mockResolvedValue([
				mutedNote,
			]);
			const state = makeState({ mutedRepos: ['owner/muted'] });
			const { dispatch } = makeMiddleware(state);
			dispatch({ type: 'GITNEWS_FETCH_NOTIFICATIONS' });
			await flushPromises();
			expect(
				window.electronApi.enrichNotificationsForAccount
			).not.toHaveBeenCalled();
		});

		it('enriches locally-unread notes even when their repo is muted', async function () {
			const note = makeBasicNote({
				id: 'lu-note',
				repositoryFullName: 'owner/muted-repo',
				gitnewsAccountId: 'acc1',
			});
			window.electronApi.listBasicNotificationsForAccount.mockResolvedValue([
				note,
			]);
			const state = makeState({
				mutedRepos: ['owner/muted-repo'],
				locallyUnreadNotes: [{ id: 'lu-note', gitnewsAccountId: 'acc1' }],
			});
			const { dispatch } = makeMiddleware(state);
			dispatch({ type: 'GITNEWS_FETCH_NOTIFICATIONS' });
			await flushPromises();
			expect(
				window.electronApi.enrichNotificationsForAccount
			).toHaveBeenCalledWith(TEST_ACCOUNT, [note]);
		});

		it('enriches locally-unread notes even when their reason does not match filterType', async function () {
			const note = makeBasicNote({
				id: 'lu-note',
				reason: 'subscribed',
				gitnewsAccountId: 'acc1',
			});
			window.electronApi.listBasicNotificationsForAccount.mockResolvedValue([
				note,
			]);
			const state = makeState({
				filterType: 'mention',
				locallyUnreadNotes: [{ id: 'lu-note', gitnewsAccountId: 'acc1' }],
			});
			const { dispatch } = makeMiddleware(state);
			dispatch({ type: 'GITNEWS_FETCH_NOTIFICATIONS' });
			await flushPromises();
			expect(
				window.electronApi.enrichNotificationsForAccount
			).toHaveBeenCalledWith(TEST_ACCOUNT, [note]);
		});
	});

	describe('Phase 2.5 — hydration cache', function () {
		it('does not enrich a note that already exists with the same updatedAt', async function () {
			const basicNote = makeBasicNote({ updatedAt: '2024-01-01T00:00:00Z' });
			const existingNote = makeHydratedNote(basicNote);
			window.electronApi.listBasicNotificationsForAccount.mockResolvedValue([basicNote]);
			const { dispatch } = makeMiddleware(makeState({ notes: [existingNote] }));
			dispatch({ type: 'GITNEWS_FETCH_NOTIFICATIONS' });
			await flushPromises();
			expect(window.electronApi.enrichNotificationsForAccount).not.toHaveBeenCalled();
		});

		it('enriches a note when its updatedAt has changed', async function () {
			const basicNote = makeBasicNote({ updatedAt: '2024-02-01T00:00:00Z' });
			const existingNote = makeHydratedNote(basicNote, { updatedAt: '2024-01-01T00:00:00Z' });
			window.electronApi.listBasicNotificationsForAccount.mockResolvedValue([basicNote]);
			const { dispatch } = makeMiddleware(makeState({ notes: [existingNote] }));
			dispatch({ type: 'GITNEWS_FETCH_NOTIFICATIONS' });
			await flushPromises();
			expect(window.electronApi.enrichNotificationsForAccount).toHaveBeenCalledWith(
				TEST_ACCOUNT,
				[basicNote]
			);
		});

		it('re-enriches a note that was previously marked invalid', async function () {
			const basicNote = makeBasicNote({ updatedAt: '2024-01-01T00:00:00Z' });
			const existingNote = makeHydratedNote(basicNote, { gitnewsIsInvalid: true });
			window.electronApi.listBasicNotificationsForAccount.mockResolvedValue([basicNote]);
			const { dispatch } = makeMiddleware(makeState({ notes: [existingNote] }));
			dispatch({ type: 'GITNEWS_FETCH_NOTIFICATIONS' });
			await flushPromises();
			expect(window.electronApi.enrichNotificationsForAccount).toHaveBeenCalledWith(
				TEST_ACCOUNT,
				[basicNote]
			);
		});

		it('includes cached hydration data in NOTES_RETRIEVED for unchanged notes', async function () {
			const basicNote = makeBasicNote({ updatedAt: '2024-01-01T00:00:00Z' });
			const existingNote = makeHydratedNote(basicNote, {
				commentUrl: 'https://github.com/owner/repo/issues/1#comment-99',
				commentUsername: 'cacheduser',
				api: {
					subject: { state: 'closed', merged: false, draft: false },
					notification: { reason: 'mention' },
				},
			});
			window.electronApi.listBasicNotificationsForAccount.mockResolvedValue([basicNote]);
			const { dispatch, next } = makeMiddleware(makeState({ notes: [existingNote] }));
			dispatch({ type: 'GITNEWS_FETCH_NOTIFICATIONS' });
			await flushPromises();
			const call = next.mock.calls.find((c) => c[0]?.type === 'NOTES_RETRIEVED');
			expect(call[0].notes[0].commentUrl).toBe(
				'https://github.com/owner/repo/issues/1#comment-99'
			);
			expect(call[0].notes[0].commentUsername).toBe('cacheduser');
			expect(call[0].notes[0].api.subject.state).toBe('closed');
		});

		it('updates unread from the fresh basic note even when using cached hydration', async function () {
			const basicNote = makeBasicNote({ updatedAt: '2024-01-01T00:00:00Z', unread: false });
			const existingNote = makeHydratedNote(basicNote, { unread: true });
			window.electronApi.listBasicNotificationsForAccount.mockResolvedValue([basicNote]);
			const { dispatch, next } = makeMiddleware(makeState({ notes: [existingNote] }));
			dispatch({ type: 'GITNEWS_FETCH_NOTIFICATIONS' });
			await flushPromises();
			const call = next.mock.calls.find((c) => c[0]?.type === 'NOTES_RETRIEVED');
			expect(call[0].notes[0].unread).toBe(false);
		});

		it('only enriches notes with changed updatedAt, reusing the rest from cache', async function () {
			const cachedNote = makeBasicNote({ id: 'n1', updatedAt: '2024-01-01T00:00:00Z' });
			const updatedNote = makeBasicNote({ id: 'n2', updatedAt: '2024-02-01T00:00:00Z' });
			const existingN1 = makeHydratedNote(cachedNote);
			const existingN2 = makeHydratedNote(updatedNote, { updatedAt: '2024-01-15T00:00:00Z' });
			window.electronApi.listBasicNotificationsForAccount.mockResolvedValue([
				cachedNote,
				updatedNote,
			]);
			const { dispatch } = makeMiddleware(makeState({ notes: [existingN1, existingN2] }));
			dispatch({ type: 'GITNEWS_FETCH_NOTIFICATIONS' });
			await flushPromises();
			expect(window.electronApi.enrichNotificationsForAccount).toHaveBeenCalledWith(
				TEST_ACCOUNT,
				[updatedNote]
			);
		});
	});

	describe('Phase 3 — enrich', function () {
		it('dispatches NOTES_RETRIEVED with the enriched notes', async function () {
			const basicNote = makeBasicNote();
			const enrichedNote = { id: 'note1', title: 'Enriched', updatedAt: '2024-01-01T00:00:00Z' };
			window.electronApi.listBasicNotificationsForAccount.mockResolvedValue([
				basicNote,
			]);
			window.electronApi.enrichNotificationsForAccount.mockResolvedValue([
				enrichedNote,
			]);
			const { dispatch, next } = makeMiddleware(makeState());
			dispatch({ type: 'GITNEWS_FETCH_NOTIFICATIONS' });
			await flushPromises();
			expect(next).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'NOTES_RETRIEVED',
					notes: [enrichedNote],
				})
			);
		});

		it('dispatches enriched notes sorted by updatedAt descending', async function () {
			const olderNote = makeBasicNote({
				id: 'older',
				updatedAt: '2024-01-01T00:00:00Z',
			});
			const newerNote = makeBasicNote({
				id: 'newer',
				updatedAt: '2024-06-01T00:00:00Z',
			});
			window.electronApi.listBasicNotificationsForAccount.mockResolvedValue([
				olderNote,
				newerNote,
			]);
			const enrichedOlder = { id: 'older', updatedAt: '2024-01-01T00:00:00Z' };
			const enrichedNewer = { id: 'newer', updatedAt: '2024-06-01T00:00:00Z' };
			// Return in wrong order to prove sorting happens
			window.electronApi.enrichNotificationsForAccount.mockResolvedValue([
				enrichedOlder,
				enrichedNewer,
			]);
			const { dispatch, next } = makeMiddleware(makeState());
			dispatch({ type: 'GITNEWS_FETCH_NOTIFICATIONS' });
			await flushPromises();
			const gotNotesCall = next.mock.calls.find(
				(call) => call[0]?.type === 'NOTES_RETRIEVED'
			);
			expect(gotNotesCall[0].notes[0].id).toBe('newer');
			expect(gotNotesCall[0].notes[1].id).toBe('older');
		});

		it('groups notes by account before calling enrichNotificationsForAccount', async function () {
			const acc2 = { id: 'acc2', name: 'Account 2', apiKey: 'key2', serverUrl: 'https://api.github.com' };
			const noteAcc1 = makeBasicNote({ id: 'n1', gitnewsAccountId: 'acc1' });
			const noteAcc2 = makeBasicNote({ id: 'n2', gitnewsAccountId: 'acc2' });
			window.electronApi.listBasicNotificationsForAccount
				.mockResolvedValueOnce([noteAcc1])
				.mockResolvedValueOnce([noteAcc2]);
			const state = makeState({ accounts: [TEST_ACCOUNT, acc2] });
			const { dispatch } = makeMiddleware(state);
			dispatch({ type: 'GITNEWS_FETCH_NOTIFICATIONS' });
			await flushPromises();
			expect(
				window.electronApi.enrichNotificationsForAccount
			).toHaveBeenCalledTimes(2);
			expect(
				window.electronApi.enrichNotificationsForAccount
			).toHaveBeenCalledWith(TEST_ACCOUNT, [noteAcc1]);
			expect(
				window.electronApi.enrichNotificationsForAccount
			).toHaveBeenCalledWith(acc2, [noteAcc2]);
		});
	});

	describe('SET_FILTER_TYPE action', function () {
		it('forwards the action to next before fetching', async function () {
			const { dispatch, next } = makeMiddleware(makeState());
			const action = { type: 'SET_FILTER_TYPE', filterType: 'mention' };
			dispatch(action);
			expect(next).toHaveBeenCalledWith(action);
		});

		it('triggers a fetch after updating filter type', async function () {
			const { dispatch } = makeMiddleware(makeState());
			dispatch({ type: 'SET_FILTER_TYPE', filterType: 'mention' });
			await flushPromises();
			expect(
				window.electronApi.listBasicNotificationsForAccount
			).toHaveBeenCalled();
		});

		it('uses the new filterType when fetching', async function () {
			const mentionNote = makeBasicNote({ id: 'n1', reason: 'mention' });
			const subscribedNote = makeBasicNote({ id: 'n2', reason: 'subscribed' });
			window.electronApi.listBasicNotificationsForAccount.mockResolvedValue([
				mentionNote,
				subscribedNote,
			]);
			// Start with filterType 'all'; SET_FILTER_TYPE switches to 'mention'
			const { dispatch } = makeMiddleware(makeState({ filterType: 'all' }));
			dispatch({ type: 'SET_FILTER_TYPE', filterType: 'mention' });
			await flushPromises();
			// Only the mention note should be passed to enrichment
			expect(
				window.electronApi.enrichNotificationsForAccount
			).toHaveBeenCalledWith(TEST_ACCOUNT, [mentionNote]);
		});
	});

	describe('fetch lifecycle', function () {
		it('dispatches FETCH_BEGIN before fetching and FETCH_END after', async function () {
			const { dispatch, next } = makeMiddleware(makeState());
			dispatch({ type: 'GITNEWS_FETCH_NOTIFICATIONS' });
			await flushPromises();
			const types = next.mock.calls.map((call) => call[0]?.type);
			expect(types[0]).toBe('FETCH_BEGIN');
			expect(types[types.length - 1]).toBe('FETCH_END');
		});

		it('skips fetching when another fetch is already in progress', async function () {
			const { dispatch } = makeMiddleware(
				makeState({ fetchingInProgress: true, fetchingStartedAt: Date.now() })
			);
			dispatch({ type: 'GITNEWS_FETCH_NOTIFICATIONS' });
			await flushPromises();
			expect(
				window.electronApi.listBasicNotificationsForAccount
			).not.toHaveBeenCalled();
		});
	});
});
