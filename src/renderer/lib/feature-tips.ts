import {
	getLowPriorityOptions,
	groupNotesByRepo,
	isNoteLowPriority,
	wouldDismissalMakeNoteLowPriority,
} from './helpers';
import { AppReduxState, FeatureTipId, Note } from '../types';

/**
 * How long to wait after a tip is dismissed or accepted before showing a
 * different one, so tips don't pile up.
 */
export const FEATURE_TIP_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * How many unread notes from one repo it takes to suggest grouping by repo.
 */
export const GROUP_BY_REPO_TIP_MIN_NOTES = 5;

export interface FeatureTip {
	tipId: FeatureTipId;
	/**
	 * The note the tip is about, which it is shown inside.
	 */
	note: Note;
	/**
	 * How many notes the tip is about, if it is about more than one.
	 */
	count?: number;
}

type FeatureTipState = Pick<
	AppReduxState,
	| 'isLowPriorityEnabled'
	| 'lowPriorityTitlePatterns'
	| 'isGroupByRepoEnabled'
	| 'dismissedFeatureTips'
	| 'lastFeatureTipDismissedAt'
>;

/**
 * Return the tip to show for these unread notes, if any.
 *
 * Only one tip is shown at a time. A tip is offered only while its setting is
 * off, if it has not been dismissed, and if no other tip was dismissed
 * recently. The tip in `confirmingTipId` was just accepted, so it is returned
 * regardless of those conditions so that it can show a confirmation.
 */
export function getFeatureTip(
	unreadNotes: Note[],
	state: FeatureTipState,
	{
		confirmingTipId,
		now = Date.now(),
	}: { confirmingTipId?: FeatureTipId; now?: number } = {}
): FeatureTip | undefined {
	const dismissedTips = state.dismissedFeatureTips ?? [];
	const lastDismissedAt = state.lastFeatureTipDismissedAt;
	const isCoolingDown =
		typeof lastDismissedAt === 'number' &&
		now - lastDismissedAt < FEATURE_TIP_COOLDOWN_MS;
	const canOffer = (tipId: FeatureTipId, isSettingEnabled: boolean) =>
		tipId === confirmingTipId ||
		(!confirmingTipId &&
			!isSettingEnabled &&
			!dismissedTips.includes(tipId) &&
			!isCoolingDown);

	if (canOffer('low-priority', state.isLowPriorityEnabled)) {
		const note = unreadNotes.find((note) =>
			wouldDismissalMakeNoteLowPriority(note, state.lowPriorityTitlePatterns)
		);
		if (note) {
			return { tipId: 'low-priority', note };
		}
	}

	if (canOffer('group-by-repo', state.isGroupByRepoEnabled)) {
		// Low priority notes are not grouped, so don't count them.
		const lowPriorityOptions = getLowPriorityOptions(state);
		const group = groupNotesByRepo(
			unreadNotes.filter((note) => !isNoteLowPriority(note, lowPriorityOptions))
		).find((group) => group.notes.length >= GROUP_BY_REPO_TIP_MIN_NOTES);
		if (group) {
			return {
				tipId: 'group-by-repo',
				note: group.notes[0],
				count: group.notes.length,
			};
		}
	}

	return undefined;
}
