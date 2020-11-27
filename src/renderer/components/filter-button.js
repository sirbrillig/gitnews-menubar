import React from 'react';
import Gridicon from 'gridicons';

export default function FilterButton({ filterType, setFilterType }) {
	const [isFiltersVisible, setFiltersVisible] = React.useState(false);
	const toggleFiltersVisible = () => setFiltersVisible(value => !value);
	const setFilter = type => {
		setFilterType(type);
		setFiltersVisible(false);
	};
	return (
		<>
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
		</>
	);
}

function FilterMenu({ filterType, setFilterType }) {
	return (
		<div className="filter-menu">
			<h3>Filter notifications</h3>
			<ul>
				<FilterMenuItem
					selected={filterType === 'all' ? true : false}
					onClick={() => setFilterType('all')}
				>
					All
				</FilterMenuItem>
				<FilterMenuItem
					selected={filterType === 'assign' ? true : false}
					onClick={() => setFilterType('assign')}
				>
					Assigned
				</FilterMenuItem>
				<FilterMenuItem
					selected={filterType === 'mention' ? true : false}
					onClick={() => setFilterType('mention')}
				>
					Mentioned
				</FilterMenuItem>
				<FilterMenuItem
					selected={filterType === 'team_mention' ? true : false}
					onClick={() => setFilterType('team_mention')}
				>
					Team mentioned
				</FilterMenuItem>
			</ul>
		</div>
	);
}

function FilterMenuItem({ children, selected, onClick }) {
	return (
		<li onClick={onClick} className={selected ? 'filter-menu__selected' : ''}>
			<span className="filter-menu__text">{children}</span>
			<Gridicon className="filter-menu__icon" icon="checkmark" size={24} />
		</li>
	);
}
