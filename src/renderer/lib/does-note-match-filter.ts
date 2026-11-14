import { FilterType, Note } from '../types';
import {
	isNoteLowPriority,
	LowPriorityOptions,
	shouldShowMentionBadge,
} from './helpers';

export interface NoteFilter {
	filterType: FilterType;
	/**
	 * If set, the "mention" filter also matches notes whose comments mention the
	 * user even when GitHub gives them another reason, the same as the mention
	 * badge.
	 */
	includeDetectedMentions?: boolean;
	/**
	 * If set, notes for closed issues and pull requests never match.
	 */
	hideClosed?: boolean;
	/**
	 * If set, notes that are low priority according to `lowPriorityOptions`
	 * never match.
	 */
	hideLowPriority?: boolean;
	lowPriorityOptions?: LowPriorityOptions;
}

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
 * The filter type picks notes by reason, and the other options hide notes
 * whatever the filter type.
 */
export default function doesNoteMatchFilter(
	note: Note,
	{
		filterType,
		includeDetectedMentions = false,
		hideClosed = false,
		hideLowPriority = false,
		lowPriorityOptions,
	}: NoteFilter
): boolean {
	if (hideClosed && isNoteClosed(note)) {
		return false;
	}
	if (hideLowPriority && isNoteLowPriority(note, lowPriorityOptions)) {
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
