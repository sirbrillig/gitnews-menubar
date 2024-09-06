import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AppReduxState } from '../types';

export default function LastChecked({
	lastSuccessfulCheck,
}: {
	lastSuccessfulCheck: AppReduxState['lastSuccessfulCheck'];
}) {
	if (!lastSuccessfulCheck) {
		return null;
	}
	const lastCheckedString = formatDistanceToNow(
		new Date(lastSuccessfulCheck * 1000),
		{ addSuffix: true }
	);

	return (
		<div className="last-checked">{'last checked: ' + lastCheckedString}</div>
	);
}
