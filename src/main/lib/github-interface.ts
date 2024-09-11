import type { AccountInfo, Note, NoteReason } from '../../shared-types';
import { Octokit } from '@octokit/rest';
import { fetch as undiciFetch, ProxyAgent } from 'undici';
import { socksDispatcher } from 'fetch-socks';
import { logMessage } from './logging';

const userAgent = 'gitnews-menubar';
const mainGithubApiUrl = 'https://api.github.com';

function getSocksVersionFromProtocol(protocol: string): 4 | 5 {
	const lastCharNum = parseInt(protocol.charAt(-1), 10);
	if (Number.isInteger(lastCharNum) && lastCharNum === 4) {
		return 4;
	}
	return 5;
}

function makeProxyDispatcher(proxyUrl: string) {
	if (proxyUrl.startsWith('socks')) {
		// eg: `socks5://user:pass@host:port` (user and pass are optional so
		// `socks5://host:port` also works)
		const proxyUrlData = new URL(proxyUrl);
		const socksVersion = getSocksVersionFromProtocol(proxyUrlData.protocol);
		// FIXME: support user and pass
		const slashParts = proxyUrl.split('/');
		const hostParts = slashParts.at(-1)?.split('@').at(-1)?.split(':') ?? [];
		const socksHost = hostParts[0];
		const socksPort = hostParts[1];
		if (socksVersion && socksHost && socksPort) {
			return socksDispatcher({
				type: socksVersion,
				host: socksHost,
				port: parseInt(socksPort, 10),
			});
		}
	}
	return new ProxyAgent(proxyUrl);
}

function makeProxyFetch(proxyUrl: string) {
	return (url: string, options: any) => {
		return undiciFetch(url, {
			...options,
			dispatcher: makeProxyDispatcher(proxyUrl),
		});
	};
}

function createOctokit(account: AccountInfo) {
	const options = {
		auth: account.apiKey,
		baseUrl: getBaseUrlForServer(account),
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

function getBaseUrlForServer(account: AccountInfo): string | undefined {
	if (account.serverUrl === mainGithubApiUrl) {
		return undefined;
	}
	// GitHub Enterprise Servers use this URL structure:
	// https://github.com/octokit/octokit.js/?tab=readme-ov-file#octokit-api-client
	const serverUrl = account.serverUrl.replace(/\/$/, '');
	return `${serverUrl}/api/v3`;
}

function getOctokitRequestPathFromUrl(
	account: AccountInfo,
	urlString: string
): string {
	const baseUrl = getBaseUrlForServer(account) ?? mainGithubApiUrl;
	return urlString.replace(baseUrl, '');
}

export async function markNotficationAsRead(
	note: Note,
	account: AccountInfo
): Promise<void> {
	const octokit = createOctokit(account);
	const path = getOctokitRequestPathFromUrl(account, note.url);
	try {
		await octokit.request(`PATCH ${path}`, {
			thread_id: note.id,
		});
	} catch (error) {
		logMessage(
			`Failed to mark notification read for ${path} (${note.url})`,
			'error'
		);
		return;
	}
}

interface RawNotification {
	id: string;
	url: string;
	subject: {
		title: string;
		type: string;
		latest_comment_url: string;
		url: string;
	};
	unread: boolean;
	reason: string;
	repository: {
		full_name: string;
		name: string;
		owner: {
			avatar_url: string;
		};
	};
	updated_at: string;
}

interface CommentData {
	commentAvatar: string;
	commentHtmlUrl: string;
}

async function getCommentDataForNotification(
	octokit: Octokit,
	account: AccountInfo,
	notification: RawNotification
): Promise<CommentData> {
	let commentAvatar: string = '';
	let commentHtmlUrl: string = '';
	const commentPath = getOctokitRequestPathFromUrl(
		account,
		notification.subject.latest_comment_url ?? notification.subject.url
	);
	try {
		const comment = await octokit.request(`GET ${commentPath}`, {});
		commentAvatar = comment.data.user.avatar_url;
		commentHtmlUrl = comment.data.html_url;
	} catch (error) {
		logMessage(
			`Failed to fetch comment for ${commentPath} (${notification.subject.latest_comment_url ?? notification.subject.url})`,
			'error'
		);
	}
	return {
		commentAvatar,
		commentHtmlUrl,
	};
}

interface SubjectData {
	noteState: string;
	noteMerged: boolean;
	subjectHtmlUrl: string;
}

async function getSubjectDataForNotification(
	octokit: Octokit,
	account: AccountInfo,
	notification: RawNotification
): Promise<SubjectData> {
	let noteState: string = '';
	let noteMerged: boolean = false;
	let subjectHtmlUrl: string = '';
	const subjectPath = getOctokitRequestPathFromUrl(
		account,
		notification.subject.url
	);
	try {
		const subject = await octokit.request(`GET ${subjectPath}`, {});
		noteState = subject.data.state;
		noteMerged = subject.data.merged;
		subjectHtmlUrl = subject.data.html_url;
	} catch (error) {
		logMessage(
			`Failed to fetch subject for ${subjectPath} (${notification.subject.url})`,
			'error'
		);
	}
	return {
		noteState,
		noteMerged,
		subjectHtmlUrl,
	};
}

function buildNoteFromData({
	account,
	notification,
	commentData,
	subjectData,
}: {
	account: AccountInfo;
	notification: RawNotification;
	commentData: CommentData;
	subjectData: SubjectData;
}): Note {
	return {
		gitnewsAccountId: account.id,
		id: notification.id,
		url: notification.url,
		title: notification.subject.title,
		unread: notification.unread,
		repositoryFullName: notification.repository.full_name,
		commentUrl: commentData.commentHtmlUrl,
		updatedAt: notification.updated_at,
		repositoryName: notification.repository.name,
		type: notification.subject.type,
		subjectUrl: subjectData.subjectHtmlUrl,
		commentAvatar:
			commentData.commentAvatar ?? notification.repository.owner.avatar_url,
		repositoryOwnerAvatar: notification.repository.owner.avatar_url,
		api: {
			subject: { state: subjectData.noteState, merged: subjectData.noteMerged },
			notification: { reason: notification.reason as NoteReason },
		},
	};
}

export async function fetchNotificationsForAccount(
	account: AccountInfo
): Promise<Note[]> {
	const octokit = createOctokit(account);
	const notificationsResponse =
		await octokit.rest.activity.listNotificationsForAuthenticatedUser({
			all: true,
		});

	const notes: Note[] = [];

	// We need to make more requests to get the details of each notification. Do
	// these fetches in parallel.
	let promises = [];
	for (const notification of notificationsResponse.data) {
		logMessage(
			`Fetching additional details for notification ${notification.id}`,
			'info'
		);
		const commentPromise = getCommentDataForNotification(
			octokit,
			account,
			notification
		);
		const subjectPromise = getSubjectDataForNotification(
			octokit,
			account,
			notification
		);
		const promise = Promise.all([commentPromise, subjectPromise]).catch(
			(err) => {
				throw err;
			}
		);
		promises.push(promise);
		promise
			.then(([commentData, subjectData]) => {
				notes.push(
					buildNoteFromData({
						account,
						notification,
						subjectData,
						commentData,
					})
				);
			})
			.catch((err) => {
				throw err;
			});
	}

	await Promise.all(promises).catch((err) => {
		throw err;
	});

	return notes;
}
