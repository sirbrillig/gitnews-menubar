import {
	BasicNote,
	Note,
	NoteReason,
	NotePriorityOverride,
	UnknownFetchError,
	AppReduxAction,
	LowPriorityTitlePatterns,
	LowPriorityCommentPatterns,
	AppReduxState,
} from '../types';
import { AppDispatch } from './store';

const maxFetchInterval = secsToMs(300); // 5 minutes

export function getNoteId(note: Note) {
	return 'gh_acc:' + note.gitnewsAccountId + '-__-gh_id:' + note.id;
}

function hasNoteUpdated(note: Note, prevNote: Note): boolean {
	// First check if the updatedAt timestamp has changed between fetches
	if (note.updatedAt && prevNote.updatedAt) {
		// If timestamps differ, the note was updated on GitHub
		if (note.updatedAt !== prevNote.updatedAt) {
			return true;
		}
	}

	// Fallback to comparing against gitnewsSeenAt for backwards compatibility
	// and to handle the "seen" state logic
	if (!note.updatedAt || !prevNote.gitnewsSeenAt) {
		return false;
	}

	const updatedAt = Date.parse(note.updatedAt);
	const seenAt = prevNote.gitnewsSeenAt;

	// Allow tolerance for clock skew between GitHub servers and local machine.
	// GitHub's timestamps have second precision while Date.now() has millisecond precision,
	// and clocks may not be perfectly synchronized.
	const TOLERANCE_MS = 30_000;

	return updatedAt > seenAt + TOLERANCE_MS;
}

function getMatchingPrevNote(prevNotes: Note[], note: Note): Note | undefined {
	return prevNotes.find((prevNote) => getNoteId(prevNote) === getNoteId(note));
}

/**
 * Return all the new notes, but if they match one of the previous notes,
 * update the new note's "seen" and "unread" properties to match those of the
 * previous note.
 *
 * This allows updated unread notes which have been "seen" to retain that
 * property if the user has already seen them.
 *
 * Note that if a previous note is not in the new notes, it will not be
 * returned. To put it another way: we only return new notes and throw away all
 * old notes.
 */
export function mergeNotifications(
	prevNotes: Note[],
	nextNotes: Note[]
): Note[] {
	return nextNotes.map((note) => {
		const previousNote = getMatchingPrevNote(prevNotes, note);
		// If the note already existed and has not changed, replace all its
		// properties but preserve the special gitnews properties so "seen" or
		// "marked unread" notes stay "seen" or "unread".
		if (previousNote && !hasNoteUpdated(note, previousNote)) {
			return {
				...note,
				gitnewsSeen: previousNote.gitnewsSeen,
				gitnewsMarkedUnread: previousNote.gitnewsMarkedUnread,
				gitnewsOpenedAt: previousNote.gitnewsOpenedAt,
				gitnewsDismissedAt: previousNote.gitnewsDismissedAt,
				gitnewsDismissedReason: previousNote.gitnewsDismissedReason,
				gitnewsDismissedCommentUrl: previousNote.gitnewsDismissedCommentUrl,
				gitnewsPriorityOverride: previousNote.gitnewsPriorityOverride,
				// Preserve local "mark as read" action if the note hasn't been updated.
				// This prevents a race condition where marking a note as read locally
				// gets overwritten by a fetch that completes before the API call to
				// GitHub finishes.
				unread: previousNote.unread === false ? false : note.unread,
			};
		}
		// Always preserve gitnewsOpenedAt even when the note has new GitHub activity,
		// since it tracks when the user last opened the note in Gitnews. The same
		// goes for the dismissal data, which is used to decide if the new activity
		// is low priority, and for the user's manual priority, which would
		// otherwise be replaced by the automatic rules on every update.
		if (previousNote) {
			return {
				...note,
				gitnewsOpenedAt: previousNote.gitnewsOpenedAt,
				gitnewsDismissedAt: previousNote.gitnewsDismissedAt,
				gitnewsDismissedReason: previousNote.gitnewsDismissedReason,
				gitnewsDismissedCommentUrl: previousNote.gitnewsDismissedCommentUrl,
				gitnewsPriorityOverride: previousNote.gitnewsPriorityOverride,
			};
		}
		return note;
	});
}

/**
 * The default for how long after a note is dismissed that new activity on it
 * is considered low priority. Long enough to cover a weekend.
 */
export const DEFAULT_LOW_PRIORITY_WINDOW_HOURS = 72;

export const LOW_PRIORITY_WINDOW_HOURS_CHOICES = [24, 48, 72, 96, 120, 168];

export const LOW_PRIORITY_WINDOW_MS = hoursToMs(
	DEFAULT_LOW_PRIORITY_WINDOW_HOURS
);

function hoursToMs(hours: number): number {
	return hours * 60 * 60 * 1000;
}

/**
 * Return true if the value can be used as the low priority window.
 */
export function isValidLowPriorityWindowHours(hours: unknown): hours is number {
	return typeof hours === 'number' && Number.isFinite(hours) && hours > 0;
}

export type LowPriorityReason = 'comment' | 'dismissed' | 'manual' | 'title';

export interface LowPriorityOptions {
	/**
	 * True if activity shortly after dismissing a note should be low priority.
	 */
	isDismissalEnabled?: boolean;
	titlePatterns?: LowPriorityTitlePatterns;
	commentPatterns?: LowPriorityCommentPatterns;
	/**
	 * How long after dismissal new activity is considered low priority.
	 */
	windowMs?: number;
}

export function getLowPriorityOptions(
	state: Pick<
		AppReduxState,
		| 'isLowPriorityEnabled'
		| 'lowPriorityTitlePatterns'
		| 'lowPriorityCommentPatterns'
		| 'lowPriorityWindowHours'
	>
): LowPriorityOptions {
	return {
		isDismissalEnabled: state.isLowPriorityEnabled,
		titlePatterns: state.lowPriorityTitlePatterns ?? {},
		commentPatterns: state.lowPriorityCommentPatterns ?? {},
		windowMs: hoursToMs(
			isValidLowPriorityWindowHours(state.lowPriorityWindowHours)
				? state.lowPriorityWindowHours
				: DEFAULT_LOW_PRIORITY_WINDOW_HOURS
		),
	};
}

/**
 * Return true if the note should be shown with lower priority.
 *
 * See `getLowPriorityReason()`.
 */
export function isNoteLowPriority(
	note: Note,
	options: LowPriorityOptions = { isDismissalEnabled: true }
): boolean {
	return Boolean(getLowPriorityReason(note, options));
}

/**
 * Return why the unread note should be shown with lower priority, or
 * undefined if it should not be.
 *
 * A note is low priority if its title matches one of its repository's title
 * patterns, if its latest comment matches one of its repository's comment
 * patterns, or if it is unread again only because of activity shortly after
 * the user dismissed it (marked it read without opening it). That activity is
 * probably minor (a pushed commit, a rebase, an automated review). A new
 * mention overrides all of these.
 *
 * Since comment patterns only look at the latest comment, a note that is low
 * priority because of a matching comment (like one from a bot) becomes normal
 * priority again when a comment that does not match is added.
 *
 * The user can also set the priority of a note manually, which overrides the
 * rules above. A manual low priority is still overridden by a new mention, but
 * a manual normal priority always wins.
 */
export function getLowPriorityReason(
	note: Note,
	{
		isDismissalEnabled = false,
		titlePatterns = {},
		commentPatterns = {},
		windowMs = LOW_PRIORITY_WINDOW_MS,
	}: LowPriorityOptions
): LowPriorityReason | undefined {
	if (!note.unread && !note.gitnewsMarkedUnread) {
		return undefined;
	}
	const override = note.gitnewsPriorityOverride;
	if (override?.priority === 'normal') {
		return undefined;
	}
	if (override?.priority === 'low') {
		return hasMentionSinceOverride(note, override) ? undefined : 'manual';
	}
	if (note.gitnewsMarkedUnread) {
		return undefined;
	}
	if (hasNewMention(note)) {
		return undefined;
	}
	if (
		doesTitleMatchPatterns(note.repositoryFullName, note.title, titlePatterns)
	) {
		return 'title';
	}
	if (
		doesTextMatchPatterns(
			note.repositoryFullName,
			note.commentExcerpt,
			commentPatterns
		)
	) {
		return 'comment';
	}
	if (
		isDismissalEnabled &&
		note.gitnewsDismissedAt &&
		isUpdateWithinLowPriorityWindow(
			note.gitnewsDismissedAt,
			note.updatedAt,
			windowMs
		)
	) {
		return 'dismissed';
	}
	return undefined;
}

/**
 * Return true if the note would be low priority because it was dismissed, if
 * that setting were turned on. Used to suggest the setting when it is off.
 */
export function wouldDismissalMakeNoteLowPriority(
	note: Note,
	titlePatterns: LowPriorityTitlePatterns = {},
	windowMs: number = LOW_PRIORITY_WINDOW_MS,
	commentPatterns: LowPriorityCommentPatterns = {}
): boolean {
	return (
		getLowPriorityReason(note, {
			isDismissalEnabled: true,
			titlePatterns,
			commentPatterns,
			windowMs,
		}) === 'dismissed'
	);
}

/**
 * Return true if the note mentions the user since it was dismissed or, if it
 * was never dismissed, if it mentions the user at all.
 */
function hasNewMention(note: Note): boolean {
	const reason = note.api?.notification?.reason;
	if (!note.gitnewsDismissedAt) {
		return isMentionReason(reason) || note.latestCommentMentionsYou === true;
	}
	if (hasReasonBecomeMention(reason, note.gitnewsDismissedReason)) {
		return true;
	}
	// A thread's reason stays "mention" forever once you are mentioned, so also
	// look for new comments that mention you.
	if (note.mentionFoundSince === note.gitnewsDismissedAt) {
		return true;
	}
	if (
		note.latestCommentMentionsYou &&
		note.commentUrl !== note.gitnewsDismissedCommentUrl
	) {
		return true;
	}
	return false;
}

/**
 * Return true if the note mentions the user since its priority was set
 * manually.
 */
function hasMentionSinceOverride(
	note: Note,
	override: NotePriorityOverride
): boolean {
	if (hasReasonBecomeMention(note.api?.notification?.reason, override.reason)) {
		return true;
	}
	return Boolean(
		note.latestCommentMentionsYou && note.commentUrl !== override.commentUrl
	);
}

/**
 * Return true if the user was mentioned recently in the note's thread rather
 * than only at some point in its history (a thread's reason stays "mention"
 * forever once you are mentioned).
 *
 * A mention is recent if it came after the note was dismissed or, if the note
 * was never dismissed, if the latest comment mentions the user.
 */
export function hasRecentMention(note: Note): boolean {
	if (!note.gitnewsDismissedAt) {
		return note.latestCommentMentionsYou === true;
	}
	return hasNewMention(note);
}

function isMentionReason(reason: NoteReason | undefined): boolean {
	return reason === 'mention' || reason === 'team_mention';
}

const compiledPatterns = new Map<string, RegExp | null>();

/**
 * Compile a title or comment pattern into a case-insensitive regular
 * expression, or return null if it is not valid.
 */
export function compileTitlePattern(pattern: string): RegExp | null {
	if (!compiledPatterns.has(pattern)) {
		let regexp: RegExp | null = null;
		try {
			regexp = new RegExp(pattern, 'i');
		} catch {
			regexp = null;
		}
		compiledPatterns.set(pattern, regexp);
	}
	return compiledPatterns.get(pattern) ?? null;
}

export function doesTitleMatchPatterns(
	repositoryFullName: string | undefined,
	title: string | undefined,
	titlePatterns: LowPriorityTitlePatterns
): boolean {
	return doesTextMatchPatterns(repositoryFullName, title, titlePatterns);
}

function doesTextMatchPatterns(
	repositoryFullName: string | undefined,
	text: string | undefined,
	patternsByRepo: Record<string, string[]>
): boolean {
	if (!repositoryFullName || !text) {
		return false;
	}
	const patterns = patternsByRepo[repositoryFullName.toLowerCase()] ?? [];
	return patterns.some((pattern) =>
		Boolean(compileTitlePattern(pattern)?.test(text))
	);
}

function isUpdateWithinLowPriorityWindow(
	dismissedAt: number,
	updatedAtString: string,
	windowMs: number
): boolean {
	const updatedAt = Date.parse(updatedAtString);
	if (Number.isNaN(updatedAt)) {
		return false;
	}
	return updatedAt - dismissedAt <= windowMs;
}

function hasReasonBecomeMention(
	reason: NoteReason | undefined,
	dismissedReason: NoteReason | undefined
): boolean {
	if (reason === 'mention' && dismissedReason !== 'mention') {
		return true;
	}
	if (reason === 'team_mention' && dismissedReason !== 'team_mention') {
		return true;
	}
	return false;
}

/**
 * If the updated note might be shown as low priority, return the time since
 * which its comments should be searched for a new mention. Otherwise return
 * undefined, since the search would make extra API requests for no reason.
 */
export function getMentionsSinceForNote(
	existingNote: Note | undefined,
	basicNote: BasicNote,
	{
		isDismissalEnabled = false,
		titlePatterns = {},
		windowMs = LOW_PRIORITY_WINDOW_MS,
	}: LowPriorityOptions = {}
): number | undefined {
	const dismissedAt = existingNote?.gitnewsDismissedAt;
	if (!dismissedAt || !basicNote.unread || existingNote.gitnewsMarkedUnread) {
		return undefined;
	}
	if (
		hasReasonBecomeMention(
			basicNote.reason,
			existingNote.gitnewsDismissedReason
		)
	) {
		return undefined;
	}
	if (
		doesTitleMatchPatterns(
			basicNote.repositoryFullName,
			basicNote.title,
			titlePatterns
		)
	) {
		return dismissedAt;
	}
	if (
		isDismissalEnabled &&
		isUpdateWithinLowPriorityWindow(dismissedAt, basicNote.updatedAt, windowMs)
	) {
		return dismissedAt;
	}
	return undefined;
}

export interface RepoNoteGroup {
	repositoryFullName: string;
	notes: Note[];
}

/**
 * Group notes by repository, keeping their order within each group. Groups
 * are sorted alphabetically by repo name so that they don't jump around when
 * newer notes arrive (eg: from different accounts at slightly different
 * times).
 */
export function groupNotesByRepo(notes: Note[]): RepoNoteGroup[] {
	const groups = new Map<string, RepoNoteGroup>();
	notes.forEach((note) => {
		const key = note.repositoryFullName.toLowerCase();
		const group = groups.get(key);
		if (group) {
			group.notes.push(note);
			return;
		}
		groups.set(key, {
			repositoryFullName: note.repositoryFullName,
			notes: [note],
		});
	});
	return Array.from(groups.entries())
		.sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
		.map(([, group]) => group);
}

export function msToSecs(ms: number): number {
	return Math.round(ms * 0.001);
}

export function secsToMs(secs: number): number {
	return secs * 1000;
}

export function isOfflineCode(code: string): boolean {
	const offlineCodes = [
		'ENETDOWN',
		'ENOTFOUND',
		'ETIMEDOUT',
		'ECONNABORTED',
		'ECONNRESET',
		'ENETUNREACH',
		'Z_BUF_ERROR',
	];
	return offlineCodes.includes(code);
}

export function getFetchInterval(interval: number, retryCount: number): number {
	const fetchInterval = interval * (retryCount + 1);
	if (fetchInterval > maxFetchInterval) {
		return maxFetchInterval;
	}
	return fetchInterval;
}

export function getErrorMessage(error: UnknownFetchError): string {
	if (!error) {
		return '';
	}
	if (typeof error === 'string') {
		return error;
	}
	return [
		error.status,
		error.code,
		error.statusText,
		error.message,
		error.url ? `for url ${error.url}` : '',
	]
		.filter(Boolean)
		.join('; ');
}

export function isGitHubOffline(error: UnknownFetchError): boolean {
	return Boolean(
		typeof error === 'object' &&
			error.status &&
			error.status.toString().startsWith('5')
	);
}

export function isTokenInvalid(error: UnknownFetchError): boolean {
	return Boolean(
		typeof error === 'object' &&
			error.status &&
			error.status.toString().startsWith('4')
	);
}

export function isInvalidJson(error: UnknownFetchError): boolean {
	return typeof error === 'object' && error.type === 'invalid-json';
}

export function isServerReturningHtml(error: UnknownFetchError): boolean {
	return (
		typeof error === 'object' &&
		typeof error.message === 'string' &&
		error.message.includes('<!DOCTYPE')
	);
}

export function getSecondsUntilNextFetch(
	lastChecked: number | false,
	fetchInterval: number
): number {
	const interval = fetchInterval - (Date.now() - (lastChecked || 0));
	return interval < 0 ? 0 : msToSecs(interval);
}

export function isAction(action: unknown): action is AppReduxAction {
	const typedAction = action as AppReduxAction;
	if (!('type' in typedAction)) {
		return false;
	}
	return true;
}

export function isDispatch(dispatch: unknown): dispatch is AppDispatch {
	if (typeof dispatch === 'function') {
		return true;
	}
	return false;
}

/**
 * Return a short description of the review comments that caused a note, like
 * "Replied to your review comment", or undefined if it was not caused by
 * review comments.
 */
export function getReviewCommentsLabel(note: Note): string | undefined {
	const reviewComments = note.reviewComments;
	if (!reviewComments) {
		return undefined;
	}
	if (reviewComments.count > 1) {
		return `Left ${reviewComments.count} review comments`;
	}
	if (reviewComments.isReplyToYou) {
		return 'Replied to your review comment';
	}
	if (reviewComments.isReply) {
		return 'Replied to a review comment';
	}
	return 'Left a review comment';
}
