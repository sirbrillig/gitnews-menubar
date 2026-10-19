export type NoteReason =
	| 'assign'
	| 'author'
	| 'ci_activity'
	| 'comment'
	| 'manual'
	| 'mention'
	| 'push'
	| 'review_requested'
	| 'security_alert'
	| 'state_change'
	| 'subscribed'
	| 'team_mention'
	| 'your_activity';

/**
 * The state of a pull request review that caused a notification.
 */
export type ReviewState = 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED';

/**
 * Increase this when hydrated notes get new data so that notes cached by an
 * older version are hydrated again.
 */
export const NOTE_HYDRATION_VERSION = 3;

/**
 * Describes the comments of a pull request review that has no body, so it is
 * clear what caused the notification.
 */
export interface ReviewCommentsInfo {
	/**
	 * The number of comments in the review.
	 */
	count: number;

	/**
	 * True if the previewed comment is a reply in a review comment thread.
	 */
	isReply: boolean;

	/**
	 * True if the previewed comment is a reply in a review comment thread
	 * started by the account's user.
	 */
	isReplyToYou: boolean;
}

export interface NoteApi {
	subject?: { state?: string; merged?: boolean; draft?: boolean };
	notification?: { reason?: NoteReason };
}

export interface NotePriorityOverride {
	priority: 'low' | 'normal';

	/**
	 * The notification reason at the time the override was set, so a new
	 * mention can override a manual low priority.
	 */
	reason?: NoteReason;

	/**
	 * The `commentUrl` at the time the override was set, so we can tell if a
	 * later comment mentions the user.
	 */
	commentUrl?: string;
}

export interface Note {
	id: string;
	url: string;
	title: string;
	unread: boolean;
	repositoryFullName: string;
	gitnewsMarkedUnread?: boolean;
	gitnewsSeen?: boolean;
	gitnewsIsInvalid?: boolean;

	/**
	 * Number of milliseconds since the epoc (what Date.now() returns).
	 */
	gitnewsSeenAt?: number;

	/**
	 * Number of milliseconds since the epoc (what Date.now() returns).
	 * Set when the user opens or manually marks the note as read in Gitnews.
	 */
	gitnewsOpenedAt?: number;

	/**
	 * Number of milliseconds since the epoc (what Date.now() returns).
	 * Set when the user marks the note as read with the mark-as-read button
	 * without opening it. Cleared when the note is opened.
	 */
	gitnewsDismissedAt?: number;

	/**
	 * The notification reason at the time the note was dismissed, so we can
	 * tell if a later update brought a new reason (like a mention).
	 */
	gitnewsDismissedReason?: NoteReason;

	/**
	 * The `commentUrl` at the time the note was dismissed, so we can tell if a
	 * later update added a new comment.
	 */
	gitnewsDismissedCommentUrl?: string;

	/**
	 * Set when the user manually marks the note as low priority or removes its
	 * low priority. This overrides the automatic low priority rules and is kept
	 * when the note gets new activity.
	 */
	gitnewsPriorityOverride?: NotePriorityOverride;

	/**
	 * True if the latest comment on the note mentions the account's user.
	 */
	latestCommentMentionsYou?: boolean;

	/**
	 * Set to the `mentionsSince` timestamp of the BasicNote if any comment or
	 * review made after that time mentions the account's user.
	 */
	mentionFoundSince?: number;

	/**
	 * True if the account's user created the issue or pull request.
	 */
	authoredByYou?: boolean;

	api: NoteApi;
	commentUrl: string;

	/**
	 * ISO 8601 formatted date string like `2017-08-23T18:20:00Z`.
	 */
	updatedAt: string;

	repositoryName: string;
	type: string;
	subjectUrl: string;
	commentAvatar?: string;
	repositoryOwnerAvatar?: string;

	commentUsername: string;

	/**
	 * The user who created the issue or pull request, which may differ from
	 * the author of the latest comment (often a bot).
	 */
	subjectAuthorLogin?: string;
	subjectAuthorAvatar?: string;

	/**
	 * A short plain-text excerpt of the latest comment (or the issue/PR
	 * description if there are no comments yet).
	 */
	commentExcerpt?: string;

	/**
	 * Set if the latest activity on a pull request is a review rather than a
	 * comment, in which case the comment data describes the review.
	 */
	reviewState?: ReviewState;

	/**
	 * Set if the latest activity is a review with no body, in which case the
	 * comment data describes the latest of the review's comments.
	 */
	reviewComments?: ReviewCommentsInfo;

	/**
	 * The `NOTE_HYDRATION_VERSION` at the time the note was hydrated.
	 */
	gitnewsHydrationVersion?: number;

	gitnewsAccountId: AccountInfo['id'];
}

export interface BasicNote {
	id: string;
	url: string;
	repositoryFullName: string;
	repositoryName: string;
	repositoryOwnerAvatar: string;
	reason: NoteReason;
	unread: boolean;
	updatedAt: string;
	title: string;
	type: string;
	subjectUrl: string;
	latestCommentUrl: string;
	gitnewsAccountId: string;

	/**
	 * Number of milliseconds since the epoc. If set, enriching the note will
	 * look through all comments and reviews made after this time for a mention
	 * of the account's user.
	 */
	mentionsSince?: number;
}

export interface AccountInfo {
	id: string;
	name: string;
	apiKey: string;
	serverUrl: string;
	proxyUrl?: string;
	isInvalid?: boolean;
}

export interface FetchErrorObject {
	code?: string;
	name?: string;
	message?: string;
	statusText?: string;
	status?: number;
	url?: string;
	type?: string;
	accountId: string;
}

/**
 * An item in a native context menu shown by the main process. Choosing an item
 * resolves the request with its `id`.
 */
export type ContextMenuItem =
	| { type: 'separator' }
	| { id: string; label: string; enabled?: boolean };
