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
}

export interface TimelineActivity {
	type: TimelineActivityType;

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
 * Return the activity on a pull request's timeline (like a push or a force
 * push) that most likely caused its notification to be updated at
 * `updatedAt`, or undefined if there is none.
 *
 * GitHub does not say why a notification was updated, so without this a push
 * would show the pull request's description as the latest activity.
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
		if (!item.event || !actorEventTypes[item.event]) {
			continue;
		}
		if (!item.actor?.login || !item.actor.avatar_url) {
			continue;
		}
		if (
			viewerLogin &&
			item.actor.login.toLowerCase() === viewerLogin.toLowerCase()
		) {
			continue;
		}
		if (time < updatedAtMs - EVENT_MATCH_WINDOW_MS || time <= newerThanMs) {
			continue;
		}
		events.push(item);
	}

	let event = events.reduce<RawTimelineItem | undefined>(
		(latest, item) =>
			!latest || getItemTime(item) >= getItemTime(latest) ? item : latest,
		undefined
	);
	const eventTime = event ? getItemTime(event) : -Infinity;
	// Merging also closes a pull request at the same time, so prefer the
	// merge.
	if (event?.event === 'closed') {
		event =
			events.find(
				(item) =>
					item.event === 'merged' &&
					eventTime - getItemTime(item) <= EVENT_MATCH_LEEWAY_MS
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

	if (!event?.event || !event.actor?.login || !event.actor.avatar_url) {
		return undefined;
	}
	const type = actorEventTypes[event.event];
	return {
		type,
		actor: { login: event.actor.login, avatar_url: event.actor.avatar_url },
		// Other events (like a merge) also have a `commit_id`, but it is not the
		// head of the branch.
		...(type === 'force_pushed' && event.commit_id
			? { headSha: event.commit_id }
			: {}),
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
