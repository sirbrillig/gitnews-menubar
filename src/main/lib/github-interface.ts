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
	const notificationsResponse =
		await octokit.rest.activity.listNotificationsForAuthenticatedUser({
			all: false,
		});

	const notes: Note[] = [];

	for (const notification of notificationsResponse.data) {
		let commentAvatar;

		if (notification.subject.latest_comment_url) {
			try {
				const commentUrl = new URL(notification.subject.latest_comment_url);
				const commentUrlPath = commentUrl.pathname;
				const comment = await octokit.request(`GET ${commentUrlPath}`, {});
				commentAvatar = comment.data.user.avatar_url;
			} catch (error) {
				console.error(
					`Failed to fetch comment for ${notification.subject.latest_comment_url}`
				);
				// This might fail but it's not that important so we will ignore it if
				// that happens.
			}
		}

		notes.push({
			id: notification.id,
			title: notification.subject.title,
			unread: notification.unread,
			repositoryFullName: notification.repository.full_name,
			commentUrl: notification.subject.latest_comment_url,
			updatedAt: notification.updated_at,
			repositoryName: notification.repository.name,
			type: notification.subject.type,
			subjectUrl: notification.subject.url,
			commentAvatar: commentAvatar ?? notification.repository.owner.avatar_url,
			repositoryOwnerAvatar: notification.repository.owner.avatar_url,
			api: {
				subject: { state: undefined, merged: undefined }, // FIXME I think this comes from the subjectUrl
				notification: { reason: notification.reason as NoteReason },
			},
		});
	}

	return notes;
}
