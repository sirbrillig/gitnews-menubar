import { Note, UnknownFetchError } from '../types';

const maxFetchInterval = secsToMs(300); // 5 minutes

export function getNoteId(note: Note) {
	return note.id;
}

export function mergeNotifications(
	prevNotes: Note[],
	nextNotes: Note[]
): Note[] {
	const getMatchingPrevNote = (note: Note) =>
		prevNotes.find((prevNote) => getNoteId(prevNote) === getNoteId(note));
	const hasNoteUpdated = (note: Note, prevNote: Note) =>
		Boolean(
			note.updatedAt &&
				prevNote.gitnewsSeenAt &&
				note.updatedAt > prevNote.gitnewsSeenAt
		);

	return nextNotes.map((note) => {
		const previousNote = getMatchingPrevNote(note);
		if (previousNote && !hasNoteUpdated(note, previousNote)) {
			return Object.assign({}, note, {
				gitnewsSeen: previousNote.gitnewsSeen,
				gitnewsMarkedUnread: previousNote.gitnewsMarkedUnread,
			});
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
			error.status.toString() === '401'
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
