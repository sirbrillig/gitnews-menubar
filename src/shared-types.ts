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

export interface NoteApi {
	subject?: { state?: string; merged?: boolean; draft?: boolean };
	notification?: { reason?: NoteReason };
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
