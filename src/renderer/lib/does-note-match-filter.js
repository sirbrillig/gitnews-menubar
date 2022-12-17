export default function doesNoteMatchFilter(note, filterType) {
	if (filterType === 'all') {
		return true;
	}
	if (filterType === note.api.notification.reason) {
		return true;
	}
	return false;
}
