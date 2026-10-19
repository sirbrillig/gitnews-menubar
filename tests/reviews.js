/* globals describe, it */
const {
	doesActivityExplainUpdate,
	findReviewForUpdate,
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
