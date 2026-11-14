import React from 'react';
import Gridicon from 'gridicons';
import { useDispatch, useSelector } from 'react-redux';
import { AppReduxState, FilterType } from '../types';
import { setHideClosed, setHideLowPriority } from '../lib/reducer';
import { getLowPriorityOptions, isNoteLowPriority } from '../lib/helpers';
import { getActiveFilters, getReadableFilterType } from '../lib/active-filters';

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
	const activeFilterCount = getActiveFilters({
		filterType,
		hideClosed,
		hideLowPriority,
	}).length;
	const isActive = activeFilterCount > 0;
	return (
		<div
			className={`filter-button__area${isActive ? ' filter-button__area--active' : ''}`}
		>
			<button
				className="filter-button"
				aria-label={
					isActive
						? `Select notification filter (${activeFilterCount} active)`
						: 'Select notification filter'
				}
				onClick={toggleFiltersVisible}
			>
				<Gridicon icon="filter" />
				{isActive && (
					<span className="filter-button__count" aria-hidden="true">
						{activeFilterCount}
					</span>
				)}
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
				<FilterMenuToggle checked={hideClosed} onClick={toggleHideClosed}>
					Hide closed
				</FilterMenuToggle>
				{toggleHideLowPriority && (
					<FilterMenuToggle
						checked={hideLowPriority}
						onClick={toggleHideLowPriority}
					>
						Hide low priority
					</FilterMenuToggle>
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

function FilterMenuToggle({
	children,
	checked,
	onClick,
}: {
	children: React.ReactNode;
	checked: boolean;
	onClick: () => void;
}) {
	return (
		<li
			role="menuitemcheckbox"
			aria-checked={checked}
			onClick={onClick}
			className={`filter-menu__toggle${checked ? ' filter-menu__toggle--checked' : ''}`}
		>
			<span className="filter-menu__checkbox">
				{checked && <Gridicon icon="checkmark" size={12} />}
			</span>
			<span className="filter-menu__text">{children}</span>
		</li>
	);
}
