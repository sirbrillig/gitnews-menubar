import React from 'react';
import Gridicon from 'gridicons';
import Notification from '../components/notification';
import { getNoteId } from 'common/lib/helpers';

function NoNotificationsIcon() {
	return (
		<Gridicon
			icon="checkmark-circle"
			size={36}
			className="no-notifications-icon"
		/>
	);
}

function NoNotifications() {
	return (
		<div className="no-notifications">
			<div>
				<NoNotificationsIcon>No new notifications!</NoNotificationsIcon>
			</div>
		</div>
	);
}

export default function NotificationsArea({
	newNotes,
	readNotes,
	markRead,
	markUnread,
	openUrl,
	token,
}) {
	const noteRows = newNotes.length ? (
		newNotes.map(note => (
			<Notification
				note={note}
				key={getNoteId(note)}
				markRead={markRead}
				markUnread={markUnread}
				token={token}
				openUrl={openUrl}
			/>
		))
	) : (
		<NoNotifications />
	);
	const readNoteRows = readNotes.map(note => (
		<Notification
			note={note}
			key={getNoteId(note)}
			markRead={markRead}
			markUnread={markUnread}
			token={token}
			openUrl={openUrl}
		/>
	));
	return (
		<div className="notifications-area">
			{noteRows}
			{readNoteRows}
		</div>
	);
}
