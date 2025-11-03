import { Note, UnknownFetchError, AppReduxAction } from '../types';
import { AppDispatch } from './store';

const maxFetchInterval = secsToMs(300); // 5 minutes

export function getNoteId(note: Note) {
	return 'gh_acc:' + note.gitnewsAccountId + '-__-gh_id:' + note.id;
}

function hasNoteUpdated(note: Note, prevNote: Note): boolean {
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
			};
		}
		return note;
	});
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
