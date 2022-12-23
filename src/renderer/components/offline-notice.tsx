import React from 'react';
import { getSecondsUntilNextFetch } from '../lib/helpers';

export default function OfflineNotice({
	fetchNotifications,
	lastChecked,
	fetchInterval,
}: {
	fetchNotifications: () => void;
	lastChecked: false | number;
	fetchInterval: number;
}) {
	const secondsRemaining = getSecondsUntilNextFetch(lastChecked, fetchInterval);
	if (secondsRemaining < 1) {
		return (
			<div className="offline-notice">
				<span>I&apos;m having trouble connecting. Retrying now...</span>
			</div>
		);
	}
	return (
		<div className="offline-notice">
			<span>
				I&apos;m having trouble connecting. Retrying in {secondsRemaining}{' '}
				seconds.
			</span>{' '}
			<button
				className="retry-button"
				onClick={fetchNotifications}
				aria-label="Retry fetching now"
			>
				Retry now
			</button>
		</div>
	);
}
