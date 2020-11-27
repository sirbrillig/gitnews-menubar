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
	searchValue,
}) {
	const [urlsToOpen, setUrlsToOpen] = React.useState([]);
	const [isMultiOpenMode, setMultiOpenMode] = React.useState(false);
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
				setMultiOpenMode(false);
			}
		},
		[openSavedUrls]
	);
	const onKeyDown = React.useCallback(
		event => {
			if (event.code.includes('Meta')) {
				setMultiOpenMode(true);
			}
		},
		[setMultiOpenMode]
	);

	React.useEffect(() => {
		window.document.addEventListener('keyup', onKeyUp);
		return () => {
			window.document.removeEventListener('keyup', onKeyUp);
		};
	}, [onKeyUp]);
	React.useEffect(() => {
		window.document.addEventListener('keydown', onKeyDown);
		return () => {
			window.document.removeEventListener('keydown', onKeyDown);
		};
	}, [onKeyDown]);

	const [muteRequestedFor, setMuteRequested] = React.useState(false);

	const orderedNotes = [...newNotes, ...readNotes].filter(note =>
		doesNoteMatchSearch(note, searchValue)
	);
	const noteRows = orderedNotes.map(note => (
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
			isMultiOpenMode={isMultiOpenMode}
		/>
	));

	return (
		<div className="notifications-area">
			{newNotes.length === 0 && readNotes.length === 0 && <NoNotifications />}
			{noteRows}
		</div>
	);
}

function doesNoteMatchSearch(note, searchValue) {
	if (note.title.toLowerCase().includes(searchValue.toLowerCase())) {
		return true;
	}
	if (
		note.repositoryFullName.toLowerCase().includes(searchValue.toLowerCase())
	) {
		return true;
	}
	return false;
}
