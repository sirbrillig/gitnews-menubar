import type { TimelineActivityType } from '../../shared-types';

export interface RawTimelineItem {
	event?: string;
	created_at?: string;
	submitted_at?: string;
	actor?: { login?: string; avatar_url?: string } | null;

	// Only set for `committed` items.
	sha?: string;
	html_url?: string;
	message?: string;
	committer?: { date?: string } | null;

	// Only set for `head_ref_force_pushed` items.
	commit_id?: string | null;

	// Only set for `commented` items (which also have `html_url`).
	body?: string | null;
	user?: { login?: string; avatar_url?: string } | null;

	// Only set for `review_requested` items.
	requested_reviewer?: { login?: string } | null;
	requested_team?: { name?: string; slug?: string } | null;
}

export interface TimelineActivity {
	/**
	 * `commented` means the activity is only a comment, which GitHub left out
	 * of the notification's `latest_comment_url`.
	 */
	type: TimelineActivityType | 'commented';

	/**
	 * The user who caused the activity. Not set for pushes since commits only
	 * have git identities.
	 */
	actor?: { login: string; avatar_url: string };

	/**
	 * The SHA of the newest commit on the branch after a push or force push.
	 */
	headSha?: string;

	/**
	 * The commits that were pushed, oldest first. Only set for pushes.
	 */
	commits?: RawTimelineItem[];

	/**
	 * A comment the actor left along with the activity (or the comment itself
	 * if the type is `commented`).
	 */
	comment?: RawTimelineItem;

	/**
	 * The team whose review was requested, if the type is `review_requested`
	 * and the review was not requested from the viewer.
	 */
	requestedTeam?: string;
}

// How long before a notification's update time an event may have happened
// and still be considered the cause of the update.
const EVENT_MATCH_WINDOW_MS = 10 * 60 * 1000;

// A few seconds of leeway in case the clocks disagree slightly.
const EVENT_MATCH_LEEWAY_MS = 60 * 1000;

// Events with an actor that can cause a notification and are shown as the
// latest activity.
const actorEventTypes: Record<string, TimelineActivityType> = {
	head_ref_force_pushed: 'force_pushed',
	merged: 'merged',
	closed: 'closed',
	reopened: 'reopened',
	review_requested: 'review_requested',
};

// Events that would have notified about any commits pushed before them, so
// commits older than these were not part of the push that caused an update.
const boundaryEventTypes = [
	'commented',
	'reviewed',
	'review_requested',
	'ready_for_review',
	'assigned',
	'merged',
	'closed',
	'reopened',
];

function getItemTime(item: RawTimelineItem): number {
	const time =
		item.event === 'committed'
			? item.committer?.date
			: (item.created_at ?? item.submitted_at);
	return Date.parse(time ?? '');
}

/**
 * Return the user who caused a timeline item, or undefined if it has none.
 */
function getItemUser(
	item: RawTimelineItem
): { login: string; avatar_url: string } | undefined {
	const user =
		item.event === 'commented' ? (item.user ?? item.actor) : item.actor;
	if (!user?.login || !user.avatar_url) {
		return undefined;
	}
	return { login: user.login, avatar_url: user.avatar_url };
}

function isSameLogin(first: string | undefined, second: string | undefined) {
	return Boolean(
		first && second && first.toLowerCase() === second.toLowerCase()
	);
}

/**
 * Return true if the item is activity that can be shown as the cause of a
 * notification for the viewer: a comment or one of `actorEventTypes`.
 */
function isShownActivity(
	item: RawTimelineItem,
	viewerLogin: string | undefined
): boolean {
	if (item.event === 'commented') {
		return Boolean(item.html_url);
	}
	if (item.event === 'review_requested') {
		// Requests for other people's reviews do not notify the viewer.
		return (
			Boolean(item.requested_team) ||
			isSameLogin(item.requested_reviewer?.login, viewerLogin)
		);
	}
	return Boolean(item.event && actorEventTypes[item.event]);
}

function getLatestItem(items: RawTimelineItem[]): RawTimelineItem | undefined {
	return items.reduce<RawTimelineItem | undefined>(
		(latest, item) =>
			!latest || getItemTime(item) >= getItemTime(latest) ? item : latest,
		undefined
	);
}

/**
 * Return the activity on a pull request's timeline (like a push or a force
 * push) that most likely caused its notification to be updated at
 * `updatedAt`, or undefined if there is none.
 *
 * GitHub does not say why a notification was updated, so without this a push
 * would show the pull request's description as the latest activity. GitHub
 * also sometimes leaves a comment out of the notification (like a comment
 * followed by a review request), so comments are found here too. A comment
 * made by the same user as an event (like asking for a review when
 * requesting it) is returned along with the event.
 *
 * Commits only have the time they were committed, which may be well before
 * they were pushed, so commits count as pushed if they are newer than the
 * last activity that would have caused an earlier notification (like a
 * comment). If there is no such activity, only commits within a few minutes
 * of the update count, so that the commits a pull request was opened with
 * are not mistaken for a push.
 *
 * If `newerThan` is set, activity at or before that time is ignored. Use it to
 * find activity after the latest comment.
 */
export function findTimelineActivityForUpdate(
	items: RawTimelineItem[],
	updatedAt: string,
	viewerLogin: string | undefined,
	newerThan?: string
): TimelineActivity | undefined {
	const updatedAtMs = Date.parse(updatedAt);
	if (Number.isNaN(updatedAtMs)) {
		return undefined;
	}
	const latestMs = updatedAtMs + EVENT_MATCH_LEEWAY_MS;
	const newerThanParsed = newerThan ? Date.parse(newerThan) : NaN;
	const newerThanMs = Number.isNaN(newerThanParsed)
		? -Infinity
		: newerThanParsed;

	const events: RawTimelineItem[] = [];
	let boundaryTime = -Infinity;
	const commits: RawTimelineItem[] = [];
	for (const item of items) {
		const time = getItemTime(item);
		if (Number.isNaN(time) || time > latestMs) {
			continue;
		}
		if (item.event === 'committed') {
			if (item.sha) {
				commits.push(item);
			}
			continue;
		}
		if (item.event && boundaryEventTypes.includes(item.event)) {
			boundaryTime = Math.max(boundaryTime, time);
		}
		if (!isShownActivity(item, viewerLogin)) {
			continue;
		}
		const user = getItemUser(item);
		if (!user || isSameLogin(user.login, viewerLogin)) {
			continue;
		}
		if (time < updatedAtMs - EVENT_MATCH_WINDOW_MS || time <= newerThanMs) {
			continue;
		}
		events.push(item);
	}

	const latest = getLatestItem(events);
	const eventTime = latest ? getItemTime(latest) : -Infinity;
	// A user often does several things at once (like commenting and then
	// requesting a review), so show their event along with their comment.
	const latestUser = latest ? getItemUser(latest) : undefined;
	const byLatestUser = events.filter((item) =>
		isSameLogin(getItemUser(item)?.login, latestUser?.login)
	);
	const comment = getLatestItem(
		byLatestUser.filter((item) => item.event === 'commented')
	);
	let event = getLatestItem(
		byLatestUser.filter((item) => item.event !== 'commented')
	);
	// Merging also closes a pull request at the same time, so prefer the
	// merge.
	if (event?.event === 'closed') {
		const closedTime = getItemTime(event);
		event =
			byLatestUser.find(
				(item) =>
					item.event === 'merged' &&
					closedTime - getItemTime(item) <= EVENT_MATCH_LEEWAY_MS
			) ?? event;
	}

	const pushedAfterMs = Math.max(
		newerThanMs,
		boundaryTime === -Infinity
			? updatedAtMs - EVENT_MATCH_WINDOW_MS
			: boundaryTime
	);
	const pushedCommits = commits
		.filter((commit) => getItemTime(commit) > pushedAfterMs)
		.sort((a, b) => getItemTime(a) - getItemTime(b));
	const latestCommit = pushedCommits.at(-1);
	// Rebased commits are committed just before they are force pushed, so a
	// commit only counts as a separate push if it is newer than the event.
	if (
		latestCommit &&
		getItemTime(latestCommit) > eventTime + EVENT_MATCH_LEEWAY_MS
	) {
		return {
			type: 'pushed',
			headSha: latestCommit.sha,
			commits: pushedCommits,
		};
	}

	if (!latestUser) {
		return undefined;
	}
	if (!event?.event) {
		return { type: 'commented', actor: latestUser, comment };
	}
	const type = actorEventTypes[event.event];
	const requestedTeam =
		type === 'review_requested' &&
		!isSameLogin(event.requested_reviewer?.login, viewerLogin)
			? (event.requested_team?.name ?? event.requested_team?.slug)
			: undefined;
	return {
		type,
		actor: latestUser,
		// Other events (like a merge) also have a `commit_id`, but it is not the
		// head of the branch.
		...(type === 'force_pushed' && event.commit_id
			? { headSha: event.commit_id }
			: {}),
		...(comment ? { comment } : {}),
		...(requestedTeam ? { requestedTeam } : {}),
	};
}

/**
 * Return the number of the last page from a `Link` response header, or
 * undefined if there is no last page (because there is only one page).
 */
export function getLastPageFromLinkHeader(
	link: string | undefined
): number | undefined {
	const match = link?.match(/<[^>]*[?&]page=(\d+)[^>]*>;\s*rel="last"/);
	return match ? parseInt(match[1], 10) : undefined;
}
