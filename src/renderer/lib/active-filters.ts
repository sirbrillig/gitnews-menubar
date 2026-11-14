import { AppReduxState, FilterType } from '../types';

export type ActiveFilterId = 'reason' | 'hide-closed' | 'hide-low-priority';

export interface ActiveFilter {
	id: ActiveFilterId;
	label: string;
}

export function getReadableFilterType(filterType: FilterType): string {
	switch (filterType) {
		case 'all':
			return 'All';
		case 'assign':
			return 'Assigned';
		case 'author':
			return 'Author';
		case 'ci_activity':
			return 'CI';
		case 'comment':
			return 'Commented';
		case 'mention':
			return 'Mentioned';
		case 'review_requested':
			return 'Review requested';
		case 'team_mention':
			return 'Team mentioned';
	}
	return filterType;
}

/**
 * Return the filters from the filter menu that are hiding notifications, in
 * the order they appear in the menu.
 */
export function getActiveFilters(
	state: Pick<AppReduxState, 'filterType' | 'hideClosed' | 'hideLowPriority'>
): ActiveFilter[] {
	const filters: ActiveFilter[] = [];
	if (state.filterType !== 'all') {
		filters.push({
			id: 'reason',
			label: getReadableFilterType(state.filterType),
		});
	}
	if (state.hideClosed) {
		filters.push({ id: 'hide-closed', label: 'Hide closed' });
	}
	if (state.hideLowPriority) {
		filters.push({ id: 'hide-low-priority', label: 'Hide low priority' });
	}
	return filters;
}
