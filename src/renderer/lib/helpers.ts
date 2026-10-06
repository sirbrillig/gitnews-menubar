import {
	BasicNote,
	Note,
	NoteReason,
	UnknownFetchError,
	AppReduxAction,
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
		// is low priority.
		if (previousNote) {
			return {
				...note,
				gitnewsOpenedAt: previousNote.gitnewsOpenedAt,
				gitnewsDismissedAt: previousNote.gitnewsDismissedAt,
				gitnewsDismissedReason: previousNote.gitnewsDismissedReason,
				gitnewsDismissedCommentUrl: previousNote.gitnewsDismissedCommentUrl,
			};
		}
		return note;
	});
}

/**
 * How long after a note is dismissed that new activity on it is considered
 * low priority.
 */
export const LOW_PRIORITY_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours

/**
 * Return true if the note is unread again only because of activity shortly
 * after the user dismissed it (marked it read without opening it).
 *
 * That activity is probably minor (a pushed commit, a rebase, an automated
 * review) so we show it with lower priority. A new mention overrides this.
 */
export function isNoteLowPriority(note: Note): boolean {
	if (!note.unread || note.gitnewsMarkedUnread || !note.gitnewsDismissedAt) {
		return false;
	}
	if (
		!isUpdateWithinLowPriorityWindow(note.gitnewsDismissedAt, note.updatedAt)
	) {
		return false;
	}
	if (
		hasReasonBecomeMention(
			note.api?.notification?.reason,
			note.gitnewsDismissedReason
		)
	) {
		return false;
	}
	// A thread's reason stays "mention" forever once you are mentioned, so also
	// look for new comments that mention you.
	if (note.mentionFoundSince === note.gitnewsDismissedAt) {
		return false;
	}
	if (
		note.latestCommentMentionsYou &&
		note.commentUrl !== note.gitnewsDismissedCommentUrl
	) {
		return false;
	}
	return true;
}

function isUpdateWithinLowPriorityWindow(
	dismissedAt: number,
	updatedAtString: string
): boolean {
	const updatedAt = Date.parse(updatedAtString);
	if (Number.isNaN(updatedAt)) {
		return false;
	}
	return updatedAt - dismissedAt <= LOW_PRIORITY_WINDOW_MS;
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
	basicNote: BasicNote
): number | undefined {
	const dismissedAt = existingNote?.gitnewsDismissedAt;
	if (!dismissedAt || !basicNote.unread || existingNote.gitnewsMarkedUnread) {
		return undefined;
	}
	if (!isUpdateWithinLowPriorityWindow(dismissedAt, basicNote.updatedAt)) {
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
	return dismissedAt;
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
