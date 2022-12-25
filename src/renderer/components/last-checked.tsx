import React from 'react';
import date from 'date-fns';
import { AppReduxState } from '../types';

export default function LastChecked({
	lastSuccessfulCheck,
}: {
	lastSuccessfulCheck: AppReduxState['lastSuccessfulCheck'];
}) {
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
