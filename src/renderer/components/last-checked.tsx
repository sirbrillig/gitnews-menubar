import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AppReduxState } from '../types.ts';

export default function LastChecked({
	lastSuccessfulCheck,
}: {
	lastSuccessfulCheck: AppReduxState['lastSuccessfulCheck'];
}) {
	if (!lastSuccessfulCheck) {
		return null;
	}
	const lastCheckedString = formatDistanceToNow(new Date(lastSuccessfulCheck), {
		addSuffix: true,
	});

	return (
		<div className="last-checked">{'last checked: ' + lastCheckedString}</div>
	);
}
