import React from 'react';
import Gridicon from 'gridicons';
import debugFactory from 'debug';
import Notification from '../components/notification';
import { getNoteId } from 'common/lib/helpers';

const debug = debugFactory('gitnews-menubar');

function NoNotificationsIcon({ children }) {
	return (
		<div>
			<Gridicon
				icon="checkmark-circle"
				size={36}
				className="no-notifications-icon"
			/>
			{children}
		</div>
	);
}

function NoNotifications() {
	return (
		<div className="no-notifications">
			<NoNotificationsIcon>No notifications!</NoNotificationsIcon>
		</div>
	);
}

export default function NotificationsArea({
	newNotes,
	readNotes,
	markRead,
	muteRepo,
	unmuteRepo,
	mutedRepos,
	markUnread,
	openUrl,
	token,
}) {
	const [urlsToOpen, setUrlsToOpen] = React.useState([]);
	const saveUrlToOpen = url => setUrlsToOpen(urls => [...urls, url]);
	const openNotificationUrl = (url, options = {}) =>
		options.openInBackground ? saveUrlToOpen(url) : openUrl(url, options);
	const openSavedUrls = React.useCallback(() => {
		debug('opening urls', urlsToOpen);
		urlsToOpen.map(openUrl);
		setUrlsToOpen([]);
	}, [openUrl, urlsToOpen]);
	const onKeyUp = React.useCallback(
		event => {
			debug('Notification keyUp', event.code);
			if (event.code.includes('Meta')) {
				openSavedUrls();
			}
		},
		[openSavedUrls]
	);
	React.useEffect(() => {
		window.document.addEventListener('keyup', onKeyUp);
		return () => {
			window.document.removeEventListener('keyup', onKeyUp);
		};
	}, [onKeyUp]);
	const [muteRequestedFor, setMuteRequested] = React.useState(false);

	const noteRows = newNotes.map(note => (
		<Notification
			note={note}
			key={getNoteId(note)}
			markRead={markRead}
			markUnread={markUnread}
			token={token}
			openUrl={openNotificationUrl}
			muteRepo={muteRepo}
			unmuteRepo={unmuteRepo}
			isMuted={mutedRepos.includes(note.repositoryFullName)}
			isMuteRequested={muteRequestedFor === note}
			setMuteRequested={setMuteRequested}
		/>
	));
	const readNoteRows = readNotes.map(note => (
		<Notification
			note={note}
			key={getNoteId(note)}
			markRead={markRead}
			markUnread={markUnread}
			token={token}
			openUrl={openNotificationUrl}
			muteRepo={muteRepo}
			unmuteRepo={unmuteRepo}
			isMuted={mutedRepos.includes(note.repositoryFullName)}
			isMuteRequested={muteRequestedFor === note}
			setMuteRequested={setMuteRequested}
		/>
	));
	return (
		<div className="notifications-area">
			{newNotes.length === 0 && readNotes.length === 0 && <NoNotifications />}
			{noteRows}
			{readNoteRows}
		</div>
	);
}
