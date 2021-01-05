const Conf = require('conf');
const config = new Conf();

const maxFetchInterval = secsToMs(300); // 5 minutes

function getNoteId(note) {
	return note.api && note.api.subject ? note.api.subject.id : note.id;
}

function getToken() {
	return config.get('gitnews-token') || process.env.GITNEWS_TOKEN;
}

function setToken(token) {
	config.set('gitnews-token', token);
}

function mergeNotifications(prevNotes, nextNotes) {
	const nextNotesUpdated = nextNotes.map(note => {
		const previousNote = findNoteInNotes(note, prevNotes);
		if (previousNote) {
			return {
				...note,
				gitnewsSeen: hasNoteUpdated(note, previousNote)
					? false
					: previousNote.gitnewsSeen,
				gitnewsMarkedUnread: previousNote.gitnewsMarkedUnread,
			};
		}
		return note;
	});
	const prevNotesWithoutUpdated = prevNotes.filter(note => {
		const nextNote = findNoteInNotes(note, nextNotes);
		return !nextNote;
	});

	return deduplicateNotes([...nextNotesUpdated, ...prevNotesWithoutUpdated]);
}

function deduplicateNotes(notes) {
	return notes.reduce((deduplicatedNotes, note) => {
		if (findNoteInNotes(note, deduplicatedNotes)) {
			return deduplicatedNotes;
		}
		return [...deduplicatedNotes, note];
	}, []);
}

function hasNoteUpdated(note, prevNote) {
	return new Date(note.updatedAt) > new Date(prevNote.updatedAt);
}

function removeOutdatedNotifications(notes) {
	return notes.filter(note => {
		const isUnread = note.unread || note.gitnewsMarkedUnread;
		if (isUnread) {
			return true;
		}
		return !isNoteOutdated(note);
	});
}

function isNoteOutdated(note) {
	const maxReadNoteDate = new Date();
	maxReadNoteDate.setDate(maxReadNoteDate.getDate() - 180); // about 6 months

	const noteDate = new Date(note.updatedAt);
	return maxReadNoteDate > noteDate;
}

function findNoteInNotes(note, notes) {
	return notes.find(noteInNotes => getNoteId(noteInNotes) === getNoteId(note));
}

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
	findNoteInNotes,
	hasNoteUpdated,
	isNoteOutdated,
};
