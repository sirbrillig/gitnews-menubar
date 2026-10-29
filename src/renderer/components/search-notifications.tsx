import React from 'react';
import Gridicon from 'gridicons';

export default function SearchNotifications({
	searchValue,
	setSearchTo,
}: {
	searchValue: string;
	setSearchTo: (value: string) => void;
}) {
	return <SearchField setSearchTo={setSearchTo} searchValue={searchValue} />;
}

function SearchField({
	setSearchTo,
	searchValue,
}: {
	setSearchTo: (value: string) => void;
	searchValue: string;
}) {
	const isActive = searchValue.length > 0;
	return (
		<div
			className={
				isActive
					? 'notifications__search-area notifications__search-area--active'
					: 'notifications__search-area'
			}
		>
			<Gridicon icon="search" size={36} className="search-icon" />
			<input
				className="notifications__search"
				type="search"
				placeholder="Search"
				onChange={(event) => setSearchTo(event.target.value)}
				onKeyDown={(event) => {
					if (event.key === 'Escape') {
						setSearchTo('');
					}
				}}
				value={searchValue}
			/>
			{isActive && (
				<button
					className="notifications__search-clear"
					onClick={() => setSearchTo('')}
					aria-label="Clear search"
					title="Clear search"
				>
					<Gridicon icon="cross-small" size={18} />
				</button>
			)}
		</div>
	);
}
