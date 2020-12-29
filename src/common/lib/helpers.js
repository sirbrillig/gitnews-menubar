const Conf = require('conf');
const config = new Conf();

const maxFetchInterval = secsToMs(300); // 5 minutes
const maxReadNoteAge = 6 * 30 * 24 * 60 * 60 * 1000; // about 6 months

function getNoteId(note) {
	return note.id;
}

function getToken() {
	return config.get('gitnews-token') || process.env.GITNEWS_TOKEN;
}

function setToken(token) {
	config.set('gitnews-token', token);
}

function mergeNotifications(prevNotes, nextNotes) {
	const didFetchReadNotifications = nextNotes.some(note => !note.unread);

	return [
		// Include all new notes, retaining custom properties unless the note has been updated
		...nextNotes.map(note => {
			const previousNote = findNoteInNotes(note, prevNotes);
			if (previousNote && !hasNoteUpdated(note, previousNote)) {
				return {
					...note,
					gitnewsSeen: previousNote.gitnewsSeen,
					gitnewsMarkedUnread: previousNote.gitnewsMarkedUnread,
				};
			}
			// Always preserve local marked unread status
			if (note.gitnewsMarkedUnread) {
				return {
					...note,
					gitnewsMarkedUnread: previousNote.gitnewsMarkedUnread,
				};
			}
			return note;
		}),
		// Include all notes previously downloaded that are not in the latest data set
		...prevNotes
			.filter(previousNote => !findNoteInNotes(previousNote, nextNotes))
			.map(previousNote => {
				// If a note has stopped being unread and we are not polling for read
				// notifications, we will assume that note has been read.
				const didNoteStopBeingUnread =
					!didFetchReadNotifications && previousNote.unread;
				if (didNoteStopBeingUnread) {
					return {
						...previousNote,
						unread: false,
					};
				}
				return previousNote;
			}),
	];
}

function removeOutdatedNotifications(notes) {
	const now = Date.now();
	return notes.filter(note => {
		const isUnread = note.unread || note.gitnewsMarkedUnread;
		if (isUnread) {
			return true;
		}
		const noteAge = now - new Date(note.updatedAt);
		return noteAge < maxReadNoteAge;
	});
}

const findNoteInNotes = (note, prevNotes) => {
	const found = prevNotes.filter(
		prevNote => getNoteId(prevNote) === getNoteId(note)
	);
	return found.length ? found[0] : null;
};

const hasNoteUpdated = (note, prevNote) =>
	new Date(note.updatedAt) > new Date(prevNote.gitnewsSeenAt);

function msToSecs(ms) {
	return parseInt(ms * 0.001, 10);
}

function secsToMs(secs) {
	return secs * 1000;
}

function isOfflineCode(code) {
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

function getFetchInterval(interval, retryCount) {
	const fetchInterval = interval * (retryCount + 1);
	if (fetchInterval > maxFetchInterval) {
		return maxFetchInterval;
	}
	return fetchInterval;
}

function getErrorMessage(error) {
	error = error || {};
	return [
		error.status,
		error.code,
		error.statusText,
		error.message,
		typeof error === 'string' ? error : null,
		error.url ? `for url ${error.url}` : '',
	]
		.filter(Boolean)
		.join('; ');
}

function isGitHubOffline(error) {
	return error.status && error.status.toString().startsWith('5');
}

function isInvalidJson(error) {
	return error.type === 'invalid-json';
}

function getSecondsUntilNextFetch(lastChecked, fetchInterval) {
	const interval = fetchInterval - (Date.now() - (lastChecked || 0));
	return interval < 0 ? 0 : msToSecs(interval);
}

module.exports = {
	getNoteId,
	getToken,
	setToken,
	mergeNotifications,
	msToSecs,
	secsToMs,
	isOfflineCode,
	getErrorMessage,
	getFetchInterval,
	isGitHubOffline,
	isInvalidJson,
	getSecondsUntilNextFetch,
	removeOutdatedNotifications,
};
