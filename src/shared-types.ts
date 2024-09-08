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
	subject?: { state?: string; merged?: boolean };
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

	gitnewsAccountId: AccountInfo['id'];
}

export interface AccountInfo {
	id: string;
	apiKey: string;
	serverUrl: string;
	proxyUrl?: string;
}
