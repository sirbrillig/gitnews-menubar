import React from 'react';
import Gridicon from 'gridicons';
import { useDispatch, useSelector } from 'react-redux';
import { AppReduxState, FilterType } from '../types';
import { setHideClosed, setHideLowPriority } from '../lib/reducer';
import { getLowPriorityOptions, isNoteLowPriority } from '../lib/helpers';

function getReadableFilterType(filterType: FilterType): string {
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

function getFilterLabel(
	filterType: FilterType,
	hideClosed: boolean,
	hideLowPriority: boolean
): string {
	const parts = [];
	if (filterType !== 'all') {
		parts.push(getReadableFilterType(filterType));
	}
	if (hideClosed) {
		parts.push('Open only');
	}
	if (hideLowPriority) {
		parts.push('No low priority');
	}
	return parts.join(' · ');
}

export default function FilterButton({
	filterType,
	setFilterType,
}: {
	filterType: FilterType;
	setFilterType: (type: FilterType) => void;
}) {
	const [isFiltersVisible, setFiltersVisible] = React.useState(false);
	const toggleFiltersVisible = () => setFiltersVisible((value) => !value);
	const setFilter = (type: FilterType) => {
		setFilterType(type);
		setFiltersVisible(false);
	};
	const hideClosed = useSelector(
		(state: AppReduxState) => state.hideClosed ?? false
	);
	const dispatch = useDispatch();
	const toggleHideClosed = () => {
		dispatch(setHideClosed(!hideClosed));
		setFiltersVisible(false);
	};
	const hideLowPriority = useSelector(
		(state: AppReduxState) => state.hideLowPriority ?? false
	);
	// Only offer to hide low priority notes when there are some to hide, or
	// when they are already hidden so that they can be shown again.
	const hasLowPriorityNotes = useSelector((state: AppReduxState) => {
		const lowPriorityOptions = getLowPriorityOptions(state);
		return state.notes.some(
			(note) =>
				!state.mutedRepos.includes(note.repositoryFullName) &&
				isNoteLowPriority(note, lowPriorityOptions)
		);
	});
	const toggleHideLowPriority = () => {
		dispatch(setHideLowPriority(!hideLowPriority));
		setFiltersVisible(false);
	};
	const isActive = filterType !== 'all' || hideClosed || hideLowPriority;
	return (
		<div
			className={`filter-button__area${isActive ? ' filter-button__area--active' : ''}`}
		>
			{isActive && (
				<label
					className="filter-label"
					htmlFor="filter-menu"
					onClick={toggleFiltersVisible}
				>
					{getFilterLabel(filterType, hideClosed, hideLowPriority)}
				</label>
			)}
			<button
				className="filter-button"
				aria-label="Select notification filter"
				onClick={toggleFiltersVisible}
			>
				<Gridicon icon="filter" />
			</button>
			{isFiltersVisible && (
				<FilterMenu
					filterType={filterType}
					setFilterType={setFilter}
					hideClosed={hideClosed}
					toggleHideClosed={toggleHideClosed}
					hideLowPriority={hideLowPriority}
					toggleHideLowPriority={
						hideLowPriority || hasLowPriorityNotes
							? toggleHideLowPriority
							: undefined
					}
				/>
			)}
		</div>
	);
}

function FilterMenu({
	filterType,
	setFilterType,
	hideClosed,
	toggleHideClosed,
	hideLowPriority,
	toggleHideLowPriority,
}: {
	filterType: FilterType;
	setFilterType: (type: FilterType) => void;
	hideClosed: boolean;
	toggleHideClosed: () => void;
	hideLowPriority: boolean;
	toggleHideLowPriority?: () => void;
}) {
	return (
		<div className="filter-menu" id="filter-menu">
			<h3>Filter notifications</h3>
			<ul>
				<FilterMenuItem
					selected={filterType === 'all' ? true : false}
					onClick={() => setFilterType('all')}
				>
					{getReadableFilterType('all')}
				</FilterMenuItem>
				<FilterMenuItem
					selected={filterType === 'assign' ? true : false}
					onClick={() => setFilterType('assign')}
				>
					{getReadableFilterType('assign')}
				</FilterMenuItem>
				<FilterMenuItem
					selected={filterType === 'author' ? true : false}
					onClick={() => setFilterType('author')}
				>
					{getReadableFilterType('author')}
				</FilterMenuItem>
				<FilterMenuItem
					selected={filterType === 'comment' ? true : false}
					onClick={() => setFilterType('comment')}
				>
					{getReadableFilterType('comment')}
				</FilterMenuItem>
				<FilterMenuItem
					selected={filterType === 'mention' ? true : false}
					onClick={() => setFilterType('mention')}
				>
					{getReadableFilterType('mention')}
				</FilterMenuItem>
				<FilterMenuItem
					selected={filterType === 'review_requested' ? true : false}
					onClick={() => setFilterType('review_requested')}
				>
					{getReadableFilterType('review_requested')}
				</FilterMenuItem>
				<FilterMenuItem
					selected={filterType === 'team_mention' ? true : false}
					onClick={() => setFilterType('team_mention')}
				>
					{getReadableFilterType('team_mention')}
				</FilterMenuItem>
			</ul>
			<ul className="filter-menu__toggles">
				<FilterMenuItem selected={hideClosed} onClick={toggleHideClosed}>
					Hide closed
				</FilterMenuItem>
				{toggleHideLowPriority && (
					<FilterMenuItem
						selected={hideLowPriority}
						onClick={toggleHideLowPriority}
					>
						Hide low priority
					</FilterMenuItem>
				)}
			</ul>
		</div>
	);
}

function FilterMenuItem({
	children,
	selected,
	onClick,
}: {
	children: React.ReactNode;
	selected: boolean;
	onClick: () => void;
}) {
	return (
		<li onClick={onClick} className={selected ? 'filter-menu__selected' : ''}>
			<span className="filter-menu__text">{children}</span>
			<Gridicon className="filter-menu__icon" icon="checkmark" size={24} />
		</li>
	);
}
