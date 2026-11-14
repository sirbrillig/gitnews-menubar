import React from 'react';
import Gridicon from 'gridicons';
import { useDispatch, useSelector } from 'react-redux';
import { AppReduxState } from '../types';
import {
	setFilterType,
	setHideClosed,
	setHideLowPriority,
} from '../lib/reducer';
import { ActiveFilterId, getActiveFilters } from '../lib/active-filters';

/**
 * Show each filter from the filter menu that is hiding notifications, with a
 * button to turn it off.
 */
export default function ActiveFiltersBar() {
	const filterType = useSelector((state: AppReduxState) => state.filterType);
	const hideClosed = useSelector(
		(state: AppReduxState) => state.hideClosed ?? false
	);
	const hideLowPriority = useSelector(
		(state: AppReduxState) => state.hideLowPriority ?? false
	);
	const dispatch = useDispatch();
	const activeFilters = getActiveFilters({
		filterType,
		hideClosed,
		hideLowPriority,
	});
	if (activeFilters.length === 0) {
		return null;
	}

	const removeFilter = (id: ActiveFilterId) => {
		switch (id) {
			case 'reason':
				dispatch(setFilterType('all'));
				return;
			case 'hide-closed':
				dispatch(setHideClosed(false));
				return;
			case 'hide-low-priority':
				dispatch(setHideLowPriority(false));
				return;
		}
	};
	const clearAll = () => activeFilters.forEach(({ id }) => removeFilter(id));

	return (
		<div className="active-filters-bar">
			<ul className="active-filters-bar__chips">
				{activeFilters.map((filter) => (
					<li key={filter.id} className="active-filters-bar__chip">
						<span>{filter.label}</span>
						<button
							className="active-filters-bar__remove"
							aria-label={`Remove filter: ${filter.label}`}
							onClick={() => removeFilter(filter.id)}
						>
							<Gridicon icon="cross-small" size={18} />
						</button>
					</li>
				))}
			</ul>
			{activeFilters.length > 1 && (
				<button className="active-filters-bar__clear" onClick={clearAll}>
					Clear all
				</button>
			)}
		</div>
	);
}
