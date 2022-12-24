import React from 'react';
import { OpenUrl } from '../types';

export default function UncheckedNotice({
	fetchingInProgress,
	openUrl,
}: {
	fetchingInProgress: boolean;
	openUrl: OpenUrl;
}) {
	const openLink = (event: React.MouseEvent<HTMLAnchorElement>) => {
		event.preventDefault();
		openUrl((event.target as HTMLAnchorElement).href);
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
					onClick={openLink}
				>
					here
				</a>{' '}
				describing what happened.
			</p>
		</div>
	);
}
