import { FilterType, Note } from '../types.ts';

export default function doesNoteMatchFilter(
	note: Note,
	filterType: FilterType
): boolean {
	if (filterType === 'all') {
		return true;
	}
	if (filterType === note.api.notification?.reason) {
		return true;
	}
	return false;
}
