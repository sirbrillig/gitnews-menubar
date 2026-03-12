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

	/**
	 * Number of milliseconds since the epoc (what Date.now() returns).
	 */
	gitnewsSeenAt?: number;

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
