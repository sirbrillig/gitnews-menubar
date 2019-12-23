import React from 'react';

export default function UncheckedNotice({ fetchingInProgress, openUrl }) {
	const openLink = event => {
		event.preventDefault();
		openUrl(event.target.href);
	};
	const message = fetchingInProgress
		? 'Checking for notifications...'
		: 'Preparing to fetch notifications...';
	return (
		<div className="unchecked-notice">
			<h2>{message}</h2>
			<p>
				If this message does not disappear, please create a new issue{' '}
				<a
					href="https://github.com/sirbrillig/gitnews-menubar/issues/new"
					onClick={openLink}>
					here
				</a>{' '}
				describing what happened.
			</p>
		</div>
	);
}
