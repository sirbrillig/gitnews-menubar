import React from 'react';
import Gridicon from 'gridicons';
import debugFactory from 'debug';
import date from 'date-fns';
import EnsuredImage from '@sirbrillig/ensured-image';

const debug = debugFactory('gitnews-menubar');

export default function Notification({
	note,
	openUrl,
	markRead,
	markUnread,
	token,
}) {
	const isUnread =
		note.unread === true ? true : note.gitnewsMarkedUnread === true;
	const onClick = event => {
		debug('clicked on notification', note, 'with metaKey', event.metaKey);
		markRead(token, note);
		openUrl(note.commentUrl, {
			activate: event.metaKey ? false : true,
		});
	};
	const timeString = date.distanceInWords(
		Date.now(),
		date.parse(note.updatedAt),
		{ addSuffix: true }
	);
	const noteClass = isUnread ? ' notification__unread' : ' notification__read';
	const defaultAvatar = `https://avatars.io/twitter/${note.repositoryFullName}`;
	const avatarSrc =
		note.commentAvatar || note.repositoryOwnerAvatar || defaultAvatar;
	const isClosed =
		note.api.subject &&
		note.api.subject.state &&
		note.api.subject.state === 'closed';
	const isMerged = note.api.subject && note.api.subject.merged;
	const iconType = isMerged || isClosed ? 'checkmark-circle' : 'chat';
	const iconText = isMerged || isClosed ? 'closed' : 'open';
	const iconClasses = [
		'notification__type',
		...(isClosed && !isMerged ? ['notification__type--closed'] : []),
		...(isMerged ? ['notification__type--merged'] : []),
	];

	return (
		<div className={'notification' + noteClass} onClick={onClick}>
			<div className={iconClasses.join(' ')}>
				<Gridicon icon={iconType} />
				<span className="notification__type--text">{iconText}</span>
			</div>
			<div className="notification__image">
				{isUnread && <span className="notification__new-dot" />}
				<EnsuredImage src={avatarSrc} />
			</div>
			<div className="notification__body">
				<div className="notification__repo">{note.repositoryFullName}</div>
				<div className="notification__title">{note.title}</div>
				<div className="notification__footer">
					<span className="notification__time">{timeString}</span>
					{isUnread ? (
						<MarkReadButton note={note} token={token} markRead={markRead} />
					) : (
						<MarkUnreadButton note={note} markUnread={markUnread} />
					)}
				</div>
			</div>
		</div>
	);
}

function MarkReadButton({ note, token, markRead }) {
	const onClick = event => {
		debug('clicked to mark notification as read', note);
		event.preventDefault();
		event.stopPropagation();
		markRead(token, note);
	};
	return (
		<button
			className="notification__mark-read"
			onClick={onClick}
			aria-label="Mark notification as read"
		>
			mark read
		</button>
	);
}

function MarkUnreadButton({ note, markUnread }) {
	const onClick = event => {
		debug('clicked to mark notification as unread', note);
		event.preventDefault();
		event.stopPropagation();
		markUnread(note);
	};
	return (
		<button
			className="notification__mark-unread"
			onClick={onClick}
			aria-label="Mark as unread"
		>
			mark unread
		</button>
	);
}
