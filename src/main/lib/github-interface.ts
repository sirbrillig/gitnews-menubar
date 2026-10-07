import { Octokit, RestEndpointMethodTypes } from '@octokit/rest';
import { fetch as undiciFetch, ProxyAgent } from 'undici';
import { socksDispatcher } from 'fetch-socks';
import { logMessage } from './logging';
import { doesTextMentionUser } from './mentions';
import type {
	AccountInfo,
	BasicNote,
	Note,
	NoteReason,
} from '../../shared-types';
import type { RequestInit } from 'undici';

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
	return (url: string, options: Partial<RequestInit>) => {
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
	if (!account.serverUrl || account.serverUrl === mainGithubApiUrl) {
		return undefined;
	}
	// GitHub Enterprise Servers use this URL structure:
	// https://github.com/octokit/octokit.js/?tab=readme-ov-file#octokit-api-client
	const serverUrl = account.serverUrl.replace(/\/$/, '');
	return `${serverUrl}/api/v3`;
}

function getWebBaseUrl(account: AccountInfo): string {
	if (!account.serverUrl || account.serverUrl === mainGithubApiUrl) {
		return 'https://github.com';
	}
	return account.serverUrl.replace(/\/$/, '');
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

export async function unsubscribeFromNotification(
	note: Note,
	account: AccountInfo
): Promise<void> {
	const octokit = createOctokit(account);
	const path = getOctokitRequestPathFromUrl(account, note.url);
	try {
		await octokit.request(`DELETE ${path}/subscription`, {
			thread_id: note.id,
		});
	} catch (error) {
		logMessage(
			`Failed to unsubscribe from notification for ${path} (${note.url})`,
			'error'
		);
		return;
	}
}

export async function resubscribeToNotification(
	note: Note,
	account: AccountInfo
): Promise<void> {
	const octokit = createOctokit(account);
	const path = getOctokitRequestPathFromUrl(account, note.url);
	try {
		await octokit.request(`PUT ${path}/subscription`, {
			thread_id: note.id,
			ignored: false,
		});
	} catch (error) {
		logMessage(
			`Failed to resubscribe to notification for ${path} (${note.url})`,
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
	commentUsername: string;
	commentMentionsViewer: boolean;
}

// The login of the user who owns each account's token, keyed by account.
const viewerLogins = new Map<string, string>();

function getViewerLoginCacheKey(account: AccountInfo): string {
	return [account.id, account.serverUrl, account.apiKey].join('|');
}

/**
 * Return the login of the user who owns the account's token, or undefined if
 * it cannot be fetched.
 */
async function getViewerLogin(
	octokit: Octokit,
	account: AccountInfo
): Promise<string | undefined> {
	const cacheKey = getViewerLoginCacheKey(account);
	const cached = viewerLogins.get(cacheKey);
	if (cached) {
		return cached;
	}
	try {
		const response = await octokit.request('GET /user');
		const login = response.data?.login;
		if (typeof login === 'string' && login) {
			viewerLogins.set(cacheKey, login);
			return login;
		}
	} catch (error) {
		logMessage(
			`Failed to fetch user login for account ${account.name} (${account.id})`,
			'error'
		);
	}
	return undefined;
}

async function getCommentDataForNotification(
	octokit: Octokit,
	account: AccountInfo,
	notification: RawNotification,
	viewerLogin: string | undefined
): Promise<CommentData> {
	let commentAvatar: string = '';
	let commentHtmlUrl: string = '';
	let commentUsername: string = '';
	let commentMentionsViewer = false;
	const commentUrl =
		notification.subject.latest_comment_url || notification.subject.url;
	if (!commentUrl) {
		return {
			commentAvatar,
			commentHtmlUrl,
			commentUsername,
			commentMentionsViewer,
		};
	}
	const commentPath = getOctokitRequestPathFromUrl(account, commentUrl);
	try {
		const comment = await octokit.request(`GET ${commentPath}`, {});
		if (!isGithubCommentResponseValid(comment)) {
			throw new Error('Invalid comment data from server');
		}
		const commentData = comment.data as RawCommentResponse['data'];
		commentAvatar = commentData.user.avatar_url;
		commentHtmlUrl = commentData.html_url;
		commentUsername = commentData.user.login;
		commentMentionsViewer = doesTextMentionUser(commentData.body, viewerLogin);
	} catch (error) {
		logMessage(
			`Failed to fetch comment for ${commentPath} (${notification.subject.latest_comment_url ?? notification.subject.url})`,
			'error'
		);
	}
	return {
		commentAvatar,
		commentHtmlUrl,
		commentUsername,
		commentMentionsViewer,
	};
}

interface RawMentionCandidate {
	body?: string | null;
	user?: { login?: string } | null;
	submitted_at?: string | null;
}

/**
 * Return the issue path (like `/repos/owner/repo/issues/12`) and, if the
 * subject is a pull request, the pull path for a notification subject.
 */
function getThreadPathsForSubject(
	account: AccountInfo,
	subjectUrl: string
): { issuePath: string; pullPath?: string } | undefined {
	const subjectPath = getOctokitRequestPathFromUrl(account, subjectUrl);
	const match = subjectPath.match(
		/^(.*\/repos\/[^/]+\/[^/]+)\/(issues|pulls)\/(\d+)$/
	);
	if (!match) {
		return undefined;
	}
	const [, repoPath, kind, number] = match;
	return {
		issuePath: `${repoPath}/issues/${number}`,
		pullPath: kind === 'pulls' ? `${repoPath}/pulls/${number}` : undefined,
	};
}

/**
 * Return true if any comment, review comment, or review on the notification's
 * subject made after `since` mentions the user.
 *
 * This finds mentions that the latest comment alone would miss, like a
 * mention followed by a bot comment, or a mention added by an edit.
 */
async function hasMentionSince(
	octokit: Octokit,
	account: AccountInfo,
	notification: RawNotification,
	since: number,
	viewerLogin: string
): Promise<boolean> {
	const paths = notification.subject.url
		? getThreadPathsForSubject(account, notification.subject.url)
		: undefined;
	if (!paths) {
		return false;
	}
	const sinceIso = new Date(since).toISOString();
	const requests: Promise<RawMentionCandidate[]>[] = [
		octokit
			.request(`GET ${paths.issuePath}/comments`, {
				since: sinceIso,
				per_page: 100,
			})
			.then((response) => response.data as RawMentionCandidate[]),
	];
	if (paths.pullPath) {
		requests.push(
			octokit
				.request(`GET ${paths.pullPath}/comments`, {
					since: sinceIso,
					per_page: 100,
				})
				.then((response) => response.data as RawMentionCandidate[])
		);
		// Reviews cannot be filtered by date in the request.
		requests.push(
			octokit
				.request(`GET ${paths.pullPath}/reviews`, { per_page: 100 })
				.then((response) =>
					(response.data as RawMentionCandidate[]).filter(
						(review) =>
							review.submitted_at && Date.parse(review.submitted_at) >= since
					)
				)
		);
	}
	// If one request fails, still check the results of the others.
	const results = await Promise.allSettled(requests);
	if (results.some((result) => result.status === 'rejected')) {
		logMessage(
			`Failed to search for some mentions in ${paths.issuePath} (${notification.subject.url})`,
			'error'
		);
	}
	return results
		.flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
		.some(
			(item) =>
				item.user?.login?.toLowerCase() !== viewerLogin.toLowerCase() &&
				doesTextMentionUser(item.body, viewerLogin)
		);
}

interface SubjectData {
	noteState: string;
	noteMerged: boolean;
	noteDraft: boolean;
	subjectHtmlUrl: string;
	subjectAuthorLogin?: string;
	failed?: boolean;
}

async function getSubjectDataForNotification(
	octokit: Octokit,
	account: AccountInfo,
	notification: RawNotification
): Promise<SubjectData> {
	let noteState: string = '';
	let noteMerged: boolean = false;
	let noteDraft: boolean = false;
	let subjectHtmlUrl: string = '';
	let subjectAuthorLogin: string | undefined;
	if (!notification.subject.url) {
		if (notification.subject.type === 'RepositoryInvitation') {
			subjectHtmlUrl = `${getWebBaseUrl(account)}/${notification.repository.full_name}/invitations`;
		}
		return { noteState, noteMerged, noteDraft, subjectHtmlUrl };
	}
	const subjectPath = getOctokitRequestPathFromUrl(
		account,
		notification.subject.url
	);
	try {
		const subject = await octokit.request(`GET ${subjectPath}`, {});
		noteState = subject.data.state;
		noteMerged = subject.data.merged;
		noteDraft = subject.data.draft ?? false;
		subjectHtmlUrl = subject.data.html_url;
		subjectAuthorLogin = subject.data.user?.login;
	} catch (error) {
		logMessage(
			`Failed to fetch subject for ${subjectPath} (${notification.subject.url})`,
			'error'
		);
		return { noteState, noteMerged, noteDraft, subjectHtmlUrl, failed: true };
	}
	return {
		noteState,
		noteMerged,
		noteDraft,
		subjectHtmlUrl,
		subjectAuthorLogin,
	};
}

function buildNoteFromData({
	account,
	notification,
	commentData,
	subjectData,
	mentionFoundSince,
	viewerLogin,
}: {
	account: AccountInfo;
	notification: RawNotification;
	commentData: CommentData;
	subjectData: SubjectData;
	mentionFoundSince?: number;
	viewerLogin?: string;
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
		commentUsername: commentData.commentUsername,
		commentAvatar:
			commentData.commentAvatar ?? notification.repository.owner.avatar_url,
		repositoryOwnerAvatar: notification.repository.owner.avatar_url,
		gitnewsIsInvalid: subjectData.failed === true,
		latestCommentMentionsYou: commentData.commentMentionsViewer,
		mentionFoundSince,
		authoredByYou: Boolean(
			viewerLogin &&
				subjectData.subjectAuthorLogin?.toLowerCase() ===
					viewerLogin.toLowerCase()
		),
		api: {
			subject: {
				state: subjectData.noteState,
				merged: subjectData.noteMerged,
				draft: subjectData.noteDraft,
			},
			notification: { reason: notification.reason as NoteReason },
		},
	};
}

interface RawCommentResponse {
	data: {
		html_url: string;
		body?: string | null;
		user: {
			login: string;
			avatar_url: string;
		};
	};
}

function isGithubCommentResponseValid(
	response: unknown
): response is RawCommentResponse {
	const properResponse = response as RawCommentResponse;
	if (!properResponse?.data) {
		return false;
	}
	if (
		!properResponse.data.html_url ||
		!properResponse.data.user?.login ||
		!properResponse.data.user?.avatar_url
	) {
		return false;
	}
	return true;
}

function isGithubActivityResponseValid(
	response: RestEndpointMethodTypes['activity']['listNotificationsForAuthenticatedUser']['response']
): boolean {
	if (!Array.isArray(response?.data)) {
		return false;
	}
	for (const notification of response.data) {
		if (!notification.id || !notification.subject) {
			return false;
		}
	}
	return true;
}

function buildBasicNoteFromRaw(
	account: AccountInfo,
	n: RawNotification
): BasicNote {
	return {
		id: n.id,
		url: n.url,
		repositoryFullName: n.repository.full_name,
		repositoryName: n.repository.name,
		repositoryOwnerAvatar: n.repository.owner.avatar_url,
		reason: n.reason as NoteReason,
		unread: n.unread,
		updatedAt: n.updated_at,
		title: n.subject.title,
		type: n.subject.type,
		subjectUrl: n.subject.url ?? '',
		latestCommentUrl: n.subject.latest_comment_url ?? '',
		gitnewsAccountId: account.id,
	};
}

export async function listBasicNotificationsForAccount(
	account: AccountInfo
): Promise<BasicNote[]> {
	const octokit = createOctokit(account);

	logMessage(
		`Asking octokit to fetch all unread notifications (paginated) for account ${account.name} (${account.id})`,
		'info'
	);

	// Paginate ALL unread notifications (all: false = only unread)
	const unreadRaw = await octokit.paginate(
		octokit.rest.activity.listNotificationsForAuthenticatedUser,
		{ all: false, per_page: 100 }
	);

	logMessage(
		`Fetched ${unreadRaw.length} unread notifications. Asking octokit to fetch first page of all notifications for account ${account.name} (${account.id})`,
		'info'
	);

	// Fetch first page of ALL notifications to capture recent read ones
	const allRaw =
		await octokit.rest.activity.listNotificationsForAuthenticatedUser({
			all: true,
			per_page: 100,
		});

	logMessage(
		`All recent notifications fetched for account ${account.name} (${account.id})`,
		'info'
	);

	if (!isGithubActivityResponseValid(allRaw)) {
		logMessage(
			`Raw notification data from account ${account.name} (${account.id}) is invalid: ${JSON.stringify(allRaw)}`,
			'error'
		);
		throw new Error(
			`Raw notification data fetched from account ${account.name} (${account.id}) is invalid. Please make sure your server is active and operating correctly (eg: it may be in maintenance).`
		);
	}

	// Deduplicate: unread list takes precedence (it's the fully-paginated source)
	const seen = new Set<string>();
	const combined: RawNotification[] = [];
	for (const n of [...unreadRaw, ...allRaw.data]) {
		if (!seen.has(n.id)) {
			seen.add(n.id);
			combined.push(n as RawNotification);
		}
	}

	return combined.map((n) => buildBasicNoteFromRaw(account, n));
}

export async function enrichNotificationsForAccount(
	account: AccountInfo,
	basicNotes: BasicNote[]
): Promise<Note[]> {
	const octokit = createOctokit(account);
	const notes: Note[] = [];
	const promises = [];
	const viewerLogin =
		basicNotes.length > 0 ? await getViewerLogin(octokit, account) : undefined;

	for (const basicNote of basicNotes) {
		// Reconstruct the RawNotification shape needed by existing helpers
		const notification: RawNotification = {
			id: basicNote.id,
			url: basicNote.url,
			subject: {
				title: basicNote.title,
				type: basicNote.type,
				url: basicNote.subjectUrl,
				latest_comment_url: basicNote.latestCommentUrl || basicNote.subjectUrl,
			},
			unread: basicNote.unread,
			reason: basicNote.reason,
			repository: {
				full_name: basicNote.repositoryFullName,
				name: basicNote.repositoryName,
				owner: { avatar_url: basicNote.repositoryOwnerAvatar },
			},
			updated_at: basicNote.updatedAt,
		};

		logMessage(
			`Fetching additional details for notification ${basicNote.id} in account ${account.name} (${account.id})`,
			'info'
		);
		const commentPromise = getCommentDataForNotification(
			octokit,
			account,
			notification,
			viewerLogin
		);
		const subjectPromise = getSubjectDataForNotification(
			octokit,
			account,
			notification
		);
		const mentionsSince = basicNote.mentionsSince;
		const mentionPromise =
			mentionsSince && viewerLogin
				? hasMentionSince(
						octokit,
						account,
						notification,
						mentionsSince,
						viewerLogin
					)
				: Promise.resolve(false);
		const promise = Promise.all([
			commentPromise,
			subjectPromise,
			mentionPromise,
		]).catch((err) => {
			throw err;
		});
		promises.push(promise);
		promise
			.then(([commentData, subjectData, hasNewMention]) => {
				notes.push(
					buildNoteFromData({
						account,
						notification,
						commentData,
						subjectData,
						mentionFoundSince: hasNewMention ? mentionsSince : undefined,
						viewerLogin,
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
