/* globals describe, it */
const {
	findTimelineActivityForUpdate,
	getLastPageFromLinkHeader,
} = require('../src/main/lib/timeline');

const updatedAt = '2026-10-19T14:18:17Z';

function makeCommit(overrides = {}) {
	return {
		event: 'committed',
		sha: 'abc123',
		html_url: 'https://github.com/owner/repo/commit/abc123',
		message: 'Fix the bug',
		committer: { date: '2026-10-19T14:17:00Z' },
		...overrides,
	};
}

function makeEvent(event, overrides = {}) {
	return {
		event,
		created_at: '2026-10-19T14:18:00Z',
		actor: {
			login: 'author',
			avatar_url: 'https://example.com/author.png',
		},
		...overrides,
	};
}

describe('findTimelineActivityForUpdate()', function () {
	it('returns undefined if there is no timeline activity', function () {
		expect(findTimelineActivityForUpdate([], updatedAt, 'viewer')).toBe(
			undefined
		);
	});

	it('returns a push of commits made shortly before the update', function () {
		const commit = makeCommit();
		expect(
			findTimelineActivityForUpdate([commit], updatedAt, 'viewer')
		).toEqual({ type: 'pushed', headSha: 'abc123', commits: [commit] });
	});

	it('does not mistake the commits a PR was opened with for a push', function () {
		const commit = makeCommit({ committer: { date: '2026-10-19T10:00:00Z' } });
		expect(
			findTimelineActivityForUpdate([commit], updatedAt, 'viewer')
		).toBeUndefined();
	});

	it('returns commits made long before the update but after other activity', function () {
		const comment = makeEvent('commented', {
			created_at: '2026-10-19T09:00:00Z',
		});
		const oldCommit = makeCommit({
			sha: 'old',
			committer: { date: '2026-10-19T08:00:00Z' },
		});
		const first = makeCommit({
			sha: 'first',
			committer: { date: '2026-10-19T11:00:00Z' },
		});
		const second = makeCommit({
			sha: 'second',
			committer: { date: '2026-10-19T12:00:00Z' },
		});
		expect(
			findTimelineActivityForUpdate(
				[oldCommit, comment, second, first],
				updatedAt,
				'viewer'
			)
		).toEqual({ type: 'pushed', headSha: 'second', commits: [first, second] });
	});

	it('ignores commits made before `newerThan`', function () {
		const commit = makeCommit();
		expect(
			findTimelineActivityForUpdate(
				[commit],
				updatedAt,
				'viewer',
				'2026-10-19T14:17:30Z'
			)
		).toBeUndefined();
	});

	it('returns a force push', function () {
		const rebased = makeCommit({ committer: { date: '2026-10-19T14:17:55Z' } });
		const forcePush = makeEvent('head_ref_force_pushed', {
			commit_id: 'def456',
		});
		expect(
			findTimelineActivityForUpdate([rebased, forcePush], updatedAt, 'viewer')
		).toEqual({
			type: 'force_pushed',
			actor: forcePush.actor,
			headSha: 'def456',
		});
	});

	it('returns a push made after a force push', function () {
		const forcePush = makeEvent('head_ref_force_pushed', {
			created_at: '2026-10-19T14:10:00Z',
		});
		const commit = makeCommit();
		expect(
			findTimelineActivityForUpdate([forcePush, commit], updatedAt, 'viewer')
				?.type
		).toEqual('pushed');
	});

	it('prefers a merge to the close that comes with it', function () {
		const merged = makeEvent('merged', { created_at: '2026-10-19T14:18:00Z' });
		const closed = makeEvent('closed', { created_at: '2026-10-19T14:18:01Z' });
		expect(
			findTimelineActivityForUpdate([closed, merged], updatedAt, 'viewer')?.type
		).toEqual('merged');
		expect(
			findTimelineActivityForUpdate([merged, closed], updatedAt, 'viewer')?.type
		).toEqual('merged');
	});

	it('does not treat the commit of a merge as the head of the branch', function () {
		const merged = makeEvent('merged', { commit_id: 'merge123' });
		expect(
			findTimelineActivityForUpdate([merged], updatedAt, 'viewer')
		).toEqual({ type: 'merged', actor: merged.actor });
	});

	it('returns a close or reopen', function () {
		expect(
			findTimelineActivityForUpdate([makeEvent('closed')], updatedAt, 'viewer')
				?.type
		).toEqual('closed');
		expect(
			findTimelineActivityForUpdate(
				[makeEvent('reopened')],
				updatedAt,
				'viewer'
			)?.type
		).toEqual('reopened');
	});

	it('does not count commits before a merge as a push', function () {
		const commit = makeCommit({ committer: { date: '2026-10-19T14:17:00Z' } });
		const merged = makeEvent('merged');
		expect(
			findTimelineActivityForUpdate([commit, merged], updatedAt, 'viewer')?.type
		).toEqual('merged');
	});

	it('ignores events by the viewer', function () {
		const closed = makeEvent('closed', {
			actor: { login: 'Viewer', avatar_url: 'https://example.com/v.png' },
		});
		expect(
			findTimelineActivityForUpdate([closed], updatedAt, 'viewer')
		).toBeUndefined();
	});

	it('ignores events too old to have caused the update', function () {
		const closed = makeEvent('closed', { created_at: '2026-10-19T12:00:00Z' });
		expect(
			findTimelineActivityForUpdate([closed], updatedAt, 'viewer')
		).toBeUndefined();
	});

	it('ignores activity after the update', function () {
		const commit = makeCommit({ committer: { date: '2026-10-19T14:30:00Z' } });
		const closed = makeEvent('closed', { created_at: '2026-10-19T14:30:00Z' });
		expect(
			findTimelineActivityForUpdate([commit, closed], updatedAt, 'viewer')
		).toBeUndefined();
	});
});

describe('getLastPageFromLinkHeader()', function () {
	it('returns the last page', function () {
		expect(
			getLastPageFromLinkHeader(
				'<https://api.github.com/repositories/1/issues/2/timeline?per_page=100&page=2>; rel="next", <https://api.github.com/repositories/1/issues/2/timeline?per_page=100&page=4>; rel="last"'
			)
		).toEqual(4);
	});

	it('returns undefined if there is no last page', function () {
		expect(getLastPageFromLinkHeader(undefined)).toBeUndefined();
		expect(
			getLastPageFromLinkHeader(
				'<https://api.github.com/repositories/1/issues/2/timeline?page=1>; rel="prev"'
			)
		).toBeUndefined();
	});
});
