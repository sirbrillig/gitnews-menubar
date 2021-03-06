import React from 'react';
import { getSecondsUntilNextFetch } from 'common/lib/helpers';

export default function OfflineNotice({
	fetchNotifications,
	lastChecked,
	fetchInterval,
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
			<button className="retry-button" onClick={fetchNotifications} aria-label="Retry fetching now">
				Retry now
			</button>
		</div>
	);
}
