import { FilterType, Note } from '../types';
import { shouldShowMentionBadge } from './helpers';

/**
 * Return true if the note is for an issue or pull request that is closed or
 * merged.
 */
export function isNoteClosed(note: Note): boolean {
	return (
		note.api.subject?.state === 'closed' || note.api.subject?.merged === true
	);
}

/**
 * Return true if the note should be shown for the filter.
 *
 * If `includeDetectedMentions` is set, the "mention" filter also matches notes
 * whose comments mention the user even when GitHub gives them another reason,
 * the same as the mention badge.
 *
 * If `hideClosed` is set, notes for closed issues and pull requests never
 * match, whatever the filter type.
 */
export default function doesNoteMatchFilter(
	note: Note,
	filterType: FilterType,
	includeDetectedMentions: boolean,
	hideClosed = false
): boolean {
	if (hideClosed && isNoteClosed(note)) {
		return false;
	}
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
