/* globals describe, it */
const {
	doesActivityExplainUpdate,
	findReviewForUpdate,
	getLatestReviewComment,
} = require('../src/main/lib/reviews');

function makeReview(overrides = {}) {
	return {
		html_url: 'https://github.com/owner/repo/pull/1#pullrequestreview-1',
		body: 'Looks good',
		state: 'APPROVED',
		submitted_at: '2026-10-19T14:17:56Z',
		user: {
			login: 'reviewer',
			avatar_url: 'https://example.com/reviewer.png',
		},
		...overrides,
	};
}

describe('findReviewForUpdate()', function () {
	it('returns a review submitted shortly before the update', function () {
		const review = makeReview();
		expect(
			findReviewForUpdate([review], '2026-10-19T14:18:17Z', 'viewer')
		).toEqual(review);
	});

	it('returns the latest matching review', function () {
		const older = makeReview({
			state: 'COMMENTED',
			submitted_at: '2026-10-19T14:15:00Z',
		});
		const newer = makeReview({ submitted_at: '2026-10-19T14:17:56Z' });
		expect(
			findReviewForUpdate([newer, older], '2026-10-19T14:18:17Z', 'viewer')
		).toEqual(newer);
	});

	it('ignores reviews submitted long before the update', function () {
		const review = makeReview({ submitted_at: '2026-10-18T14:17:56Z' });
		expect(
			findReviewForUpdate([review], '2026-10-19T14:18:17Z', 'viewer')
		).toBeUndefined();
	});

	it('ignores reviews submitted after the update', function () {
		const review = makeReview({ submitted_at: '2026-10-19T15:00:00Z' });
		expect(
			findReviewForUpdate([review], '2026-10-19T14:18:17Z', 'viewer')
		).toBeUndefined();
	});

	it('ignores reviews by the viewer', function () {
		const review = makeReview({
			user: { login: 'Viewer', avatar_url: 'https://example.com/v.png' },
		});
		expect(
			findReviewForUpdate([review], '2026-10-19T14:18:17Z', 'viewer')
		).toBeUndefined();
	});

	it('ignores pending and dismissed reviews', function () {
		const reviews = [
			makeReview({ state: 'PENDING' }),
			makeReview({ state: 'DISMISSED' }),
		];
		expect(
			findReviewForUpdate(reviews, '2026-10-19T14:18:17Z', 'viewer')
		).toBeUndefined();
	});

	it('returns a review with an empty body', function () {
		const review = makeReview({ body: '' });
		expect(
			findReviewForUpdate([review], '2026-10-19T14:18:17Z', 'viewer')
		).toEqual(review);
	});

	it('ignores reviews submitted before the newerThan time', function () {
		const review = makeReview({ submitted_at: '2026-10-19T14:15:00Z' });
		expect(
			findReviewForUpdate(
				[review],
				'2026-10-19T14:18:17Z',
				'viewer',
				'2026-10-19T14:16:00Z'
			)
		).toBeUndefined();
	});

	it('returns reviews submitted after the newerThan time', function () {
		const review = makeReview();
		expect(
			findReviewForUpdate(
				[review],
				'2026-10-19T14:18:17Z',
				'viewer',
				'2026-10-19T14:16:00Z'
			)
		).toEqual(review);
	});
});

describe('doesActivityExplainUpdate()', function () {
	it('returns true for activity at the time of the update', function () {
		expect(
			doesActivityExplainUpdate('2026-10-19T14:18:00Z', '2026-10-19T14:18:17Z')
		).toBe(true);
	});

	it('returns false for activity well before the update', function () {
		expect(
			doesActivityExplainUpdate('2026-10-19T14:10:00Z', '2026-10-19T14:18:17Z')
		).toBe(false);
	});

	it('returns true if the activity time is unknown', function () {
		expect(doesActivityExplainUpdate(undefined, '2026-10-19T14:18:17Z')).toBe(
			true
		);
	});
});

describe('getLatestReviewComment()', function () {
	function makeComment(overrides = {}) {
		return {
			id: 1,
			html_url: 'https://github.com/owner/repo/pull/1#discussion_r1',
			body: 'Good point, fixed',
			created_at: '2026-10-19T14:17:56Z',
			in_reply_to_id: 5,
			user: {
				login: 'reviewer',
				avatar_url: 'https://example.com/reviewer.png',
			},
			...overrides,
		};
	}

	it('returns undefined if there are no comments', function () {
		expect(getLatestReviewComment([])).toBeUndefined();
	});

	it('returns the only comment', function () {
		const comment = makeComment();
		expect(getLatestReviewComment([comment])).toEqual(comment);
	});

	it('returns the most recently created comment', function () {
		const older = makeComment({ id: 1, created_at: '2026-10-19T14:15:00Z' });
		const newer = makeComment({ id: 2, created_at: '2026-10-19T14:17:00Z' });
		expect(getLatestReviewComment([newer, older])).toEqual(newer);
		expect(getLatestReviewComment([older, newer])).toEqual(newer);
	});

	it('ignores comments without a URL', function () {
		const comment = makeComment({ created_at: '2026-10-19T14:15:00Z' });
		const invalid = makeComment({ html_url: undefined });
		expect(getLatestReviewComment([comment, invalid])).toEqual(comment);
	});

	it('returns a comment with an unknown creation time', function () {
		const comment = makeComment({ created_at: undefined });
		expect(getLatestReviewComment([comment])).toEqual(comment);
	});
});
