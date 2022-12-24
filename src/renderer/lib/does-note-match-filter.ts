import { Note } from '../types';

export default function doesNoteMatchFilter(
	note: Note,
	filterType: string
): boolean {
	if (filterType === 'all') {
		return true;
	}
	if (filterType === note.api.notification.reason) {
		return true;
	}
	return false;
}
