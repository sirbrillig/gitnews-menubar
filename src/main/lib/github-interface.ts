import type { AccountInfo, Note, NoteReason } from '../../shared-types';
import { Octokit } from '@octokit/rest';

export async function fetchNotificationsForAccount(
	account: AccountInfo
): Promise<Note[]> {
	const octokit = new Octokit({
		auth: account.apiKey,
		baseUrl: account.serverUrl,
		userAgent: 'gitnews-menubar',
	});
	const notifications =
		await octokit.rest.activity.listNotificationsForAuthenticatedUser({
			all: false,
		});
	return notifications.data.map((notification) => {
		return {
			id: notification.id,
			title: notification.subject.title,
			unread: notification.unread,
			repositoryFullName: notification.repository.full_name,
			commentUrl: notification.subject.latest_comment_url,
			updatedAt: notification.updated_at,
			repositoryName: notification.repository.name,
			type: notification.subject.type,
			subjectUrl: notification.subject.url,
			commentAvatar: notification.repository.owner.avatar_url, // FIXME I think this comes from the commentUrl
			repositoryOwnerAvatar: notification.repository.owner.avatar_url,
			api: {
				subject: { state: undefined, merged: undefined }, // FIXME I think this comes from the subjectUrl
				notification: { reason: notification.reason as NoteReason },
			},
		};
	});
}
