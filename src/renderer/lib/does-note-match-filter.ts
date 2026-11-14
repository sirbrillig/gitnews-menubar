import { FilterType, Note } from '../types';
import { shouldShowMentionBadge } from './helpers';

/**
 * Return true if the note should be shown for the filter.
 *
 * If `includeDetectedMentions` is set, the "mention" filter also matches notes
 * whose comments mention the user even when GitHub gives them another reason,
 * the same as the mention badge.
 */
export default function doesNoteMatchFilter(
	note: Note,
	filterType: FilterType,
	includeDetectedMentions: boolean
): boolean {
	if (filterType === 'all') {
		return true;
	}
	if (filterType === note.api.notification?.reason) {
		return true;
	}
	if (filterType === 'mention' && includeDetectedMentions) {
		return shouldShowMentionBadge(note);
	}
	return false;
}
