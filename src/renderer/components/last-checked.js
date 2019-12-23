import React from 'react';
import date from 'date-fns';

export default function LastChecked({ lastSuccessfulCheck }) {
	if (!lastSuccessfulCheck) {
		return null;
	}
	const lastCheckedString = date.distanceInWords(
		Date.now(),
		date.parse(lastSuccessfulCheck),
		{ addSuffix: true }
	);

	return (
		<div className="last-checked">{'last checked: ' + lastCheckedString}</div>
	);
}
