import type { ReviewState } from '../../shared-types';

export interface RawReview {
	html_url?: string;
	body?: string | null;
	state?: string;
	submitted_at?: string | null;
	user?: { login?: string; avatar_url?: string } | null;
}

// How long before a notification's update time a review may have been
// submitted and still be considered the cause of the update.
const REVIEW_MATCH_WINDOW_MS = 10 * 60 * 1000;

// A few seconds of leeway in case the clocks disagree slightly.
const REVIEW_MATCH_LEEWAY_MS = 60 * 1000;

const reviewStates: ReviewState[] = [
	'APPROVED',
	'CHANGES_REQUESTED',
	'COMMENTED',
];

function isReviewState(state: string | undefined): state is ReviewState {
	return reviewStates.includes(state as ReviewState);
}

/**
 * Return the review that most likely caused a pull request notification to
 * be updated at `updatedAt`, or undefined if there is none.
 *
 * GitHub does not include a `latest_comment_url` for reviews, so this is
 * the only way to tell that a notification is about a review like an
 * approval. Reviews by the viewer are ignored since GitHub does not notify
 * people about their own activity.
 */
export function findReviewForUpdate(
	reviews: RawReview[],
	updatedAt: string,
	viewerLogin: string | undefined
): (RawReview & { state: ReviewState }) | undefined {
	const updatedAtMs = Date.parse(updatedAt);
	if (Number.isNaN(updatedAtMs)) {
		return undefined;
	}
	let match: (RawReview & { state: ReviewState }) | undefined;
	let matchTime = -Infinity;
	for (const review of reviews) {
		if (!isReviewState(review.state) || !review.submitted_at) {
			continue;
		}
		if (!review.html_url || !review.user?.login || !review.user.avatar_url) {
			continue;
		}
		if (
			viewerLogin &&
			review.user.login.toLowerCase() === viewerLogin.toLowerCase()
		) {
			continue;
		}
		const submittedAtMs = Date.parse(review.submitted_at);
		if (
			submittedAtMs > updatedAtMs + REVIEW_MATCH_LEEWAY_MS ||
			submittedAtMs < updatedAtMs - REVIEW_MATCH_WINDOW_MS
		) {
			continue;
		}
		if (submittedAtMs >= matchTime) {
			match = { ...review, state: review.state };
			matchTime = submittedAtMs;
		}
	}
	return match;
}
