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
	return (
		<div className="notifications__search-area">
			<Gridicon icon="search" size={36} className="search-icon" />
			<input
				className="notifications__search"
				type="search"
				placeholder="Search"
				onChange={event => setSearchTo(event.target.value)}
				value={searchValue}
			/>
		</div>
	);
}
