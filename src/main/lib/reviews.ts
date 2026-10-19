import type { ReviewState } from '../../shared-types';

export interface RawReview {
	id?: number;
	html_url?: string;
	body?: string | null;
	state?: string;
	submitted_at?: string | null;
	user?: { login?: string; avatar_url?: string } | null;
}

export interface RawReviewComment {
	id?: number;
	html_url?: string;
	body?: string | null;
	created_at?: string;
	in_reply_to_id?: number | null;
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
 * Return true if activity (like a comment) at `activityAt` could have caused
 * a notification to be updated at `updatedAt`.
 *
 * Returns true if either time cannot be parsed, so that a missing time does
 * not cause extra requests.
 */
export function doesActivityExplainUpdate(
	activityAt: string | undefined,
	updatedAt: string
): boolean {
	const activityAtMs = Date.parse(activityAt ?? '');
	const updatedAtMs = Date.parse(updatedAt);
	if (Number.isNaN(activityAtMs) || Number.isNaN(updatedAtMs)) {
		return true;
	}
	return activityAtMs >= updatedAtMs - REVIEW_MATCH_LEEWAY_MS;
}

/**
 * Return the review that most likely caused a pull request notification to
 * be updated at `updatedAt`, or undefined if there is none.
 *
 * GitHub does not include a `latest_comment_url` for reviews, so this is
 * the only way to tell that a notification is about a review like an
 * approval. Reviews by the viewer are ignored since GitHub does not notify
 * people about their own activity.
 *
 * If `newerThan` is set, reviews submitted at or before that time are
 * ignored. Use it to find a review submitted after the latest comment.
 */
export function findReviewForUpdate(
	reviews: RawReview[],
	updatedAt: string,
	viewerLogin: string | undefined,
	newerThan?: string
): (RawReview & { state: ReviewState }) | undefined {
	const updatedAtMs = Date.parse(updatedAt);
	if (Number.isNaN(updatedAtMs)) {
		return undefined;
	}
	const newerThanMs = newerThan ? Date.parse(newerThan) : NaN;
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
		if (!Number.isNaN(newerThanMs) && submittedAtMs <= newerThanMs) {
			continue;
		}
		if (submittedAtMs >= matchTime) {
			match = { ...review, state: review.state };
			matchTime = submittedAtMs;
		}
	}
	return match;
}

/**
 * Return the most recently created of a review's comments, or undefined if
 * there are none.
 *
 * A review with no body (like a reply in a review comment thread) only has
 * its comments to show, so use this to find one to preview.
 */
export function getLatestReviewComment(
	comments: RawReviewComment[]
): RawReviewComment | undefined {
	let latest: RawReviewComment | undefined;
	let latestTime = -Infinity;
	for (const comment of comments) {
		if (!comment.html_url) {
			continue;
		}
		const createdAtMs = Date.parse(comment.created_at ?? '');
		const time = Number.isNaN(createdAtMs) ? -Infinity : createdAtMs;
		if (!latest || time >= latestTime) {
			latest = comment;
			latestTime = time;
		}
	}
	return latest;
}
