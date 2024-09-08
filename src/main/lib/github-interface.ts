import type { AccountInfo, Note, NoteReason } from '../../shared-types';
import { Octokit } from '@octokit/rest';
import { fetch as undiciFetch, ProxyAgent } from 'undici';

const userAgent = 'gitnews-menubar';

function makeProxyFetch(proxyUrl: string) {
	return (url: string, options: any) => {
		return undiciFetch(url, {
			...options,
			dispatcher: new ProxyAgent(proxyUrl),
		});
	};
}

function createOctokit(account: AccountInfo) {
	const options = {
		auth: account.apiKey,
		baseUrl: account.serverUrl,
		userAgent,
	};
	if (account.proxyUrl) {
		const proxyFetch = makeProxyFetch(account.proxyUrl);
		return new Octokit({
			...options,
			request: {
				fetch: proxyFetch,
			},
		});
	}
	return new Octokit(options);
}

export async function markNotficationAsRead(
	note: Note,
	account: AccountInfo
): Promise<void> {
	const octokit = createOctokit(account);
	try {
		const threadUrl = new URL(note.url);
		const threadUrlPath = threadUrl.pathname;
		await octokit.request(`PATCH ${threadUrlPath}`, {
			thread_id: note.id,
		});
	} catch (error) {
		console.error(`Failed to mark notification read for ${note.id}`, note);
		return;
	}
}

export async function fetchNotificationsForAccount(
	account: AccountInfo
): Promise<Note[]> {
	const octokit = createOctokit(account);
	const notificationsResponse =
		await octokit.rest.activity.listNotificationsForAuthenticatedUser({
			all: false,
		});

	const notes: Note[] = [];

	for (const notification of notificationsResponse.data) {
		let commentAvatar: string;
		let commentHtmlUrl: string;
		try {
			const commentUrl = new URL(
				notification.subject.latest_comment_url ?? notification.subject.url
			);
			const commentUrlPath = commentUrl.pathname;
			const comment = await octokit.request(`GET ${commentUrlPath}`, {});
			commentAvatar = comment.data.user.avatar_url;
			commentHtmlUrl = comment.data.html_url;
		} catch (error) {
			console.error(
				`Failed to fetch comment for ${notification.subject.latest_comment_url ?? notification.subject.url}`,
				notification
			);
			continue;
		}

		let noteState: string;
		let noteMerged: boolean;
		let subjectHtmlUrl: string;
		try {
			const subjectUrl = new URL(notification.subject.url);
			const subjectUrlPath = subjectUrl.pathname;
			const subject = await octokit.request(`GET ${subjectUrlPath}`, {});
			noteState = subject.data.state;
			noteMerged = subject.data.merged;
			subjectHtmlUrl = subject.data.html_url;
		} catch (error) {
			console.error(
				`Failed to fetch subject for ${notification.subject.url}`,
				notification.subject
			);
			continue;
		}

		notes.push({
			gitnewsAccountId: account.id,
			id: notification.id,
			url: notification.url,
			title: notification.subject.title,
			unread: notification.unread,
			repositoryFullName: notification.repository.full_name,
			commentUrl: commentHtmlUrl,
			updatedAt: notification.updated_at,
			repositoryName: notification.repository.name,
			type: notification.subject.type,
			subjectUrl: subjectHtmlUrl,
			commentAvatar: commentAvatar ?? notification.repository.owner.avatar_url,
			repositoryOwnerAvatar: notification.repository.owner.avatar_url,
			api: {
				subject: { state: noteState, merged: noteMerged },
				notification: { reason: notification.reason as NoteReason },
			},
		});
	}

	return notes;
}
