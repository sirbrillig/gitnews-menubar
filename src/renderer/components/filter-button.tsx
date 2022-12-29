import React from 'react';
import Gridicon from 'gridicons';
import { FilterType } from '../types';

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
	return (
		<div className="filter-button__area">
			{filterType !== 'all' && (
				<label
					className="filter-label"
					htmlFor="filter-menu"
					onClick={toggleFiltersVisible}
				>
					{getReadableFilterType(filterType)}
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
				<FilterMenu filterType={filterType} setFilterType={setFilter} />
			)}
		</div>
	);
}

function FilterMenu({
	filterType,
	setFilterType,
}: {
	filterType: FilterType;
	setFilterType: (type: FilterType) => void;
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
