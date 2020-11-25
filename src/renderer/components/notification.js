import React from 'react';
import Gridicon from 'gridicons';
import debugFactory from 'debug';
import date from 'date-fns';
import EnsuredImage from './ensured-image';

const debug = debugFactory('gitnews-menubar');

export default function Notification({
	note,
	openUrl,
	markRead,
	markUnread,
	token,
	muteRepo,
	unmuteRepo,
	isMuted,
	isMuteRequested,
	setMuteRequested,
}) {
	const isUnread =
		note.unread === true ? true : note.gitnewsMarkedUnread === true;
	const onClick = event => {
		debug('clicked on notification', note, 'with metaKey', event.metaKey);
		setMuteRequested(false);
		markRead(token, note);
		openUrl(note.commentUrl, {
			openInBackground: !!event.metaKey,
		});
	};
	const timeString = date.distanceInWords(
		Date.now(),
		date.parse(note.updatedAt),
		{ addSuffix: true }
	);
	const noteClasses = [
		'notification',
		...getNoteClasses({ isUnread, isMuted }),
	];
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

	const doMute = event => {
		event.preventDefault();
		event.stopPropagation();
		setMuteRequested(note);
	};
	const doUnmute = event => {
		event.preventDefault();
		event.stopPropagation();
		unmuteRepo(note.repositoryFullName);
	};

	if (isMuteRequested) {
		return (
			<div className={noteClasses.join(' ')}>
				<div className="notification__mute-confirm">
					<div className="notification__mute-confirm__text">
						<div className="notification__mute-confirm__title">Mute all notifications from {note.repositoryFullName}?</div>
						Notifications from a muted repo will not cause the icon to change. You can unmute it later.
					</div>
					<div className="notification__mute-confirm__buttons">
						<MuteRepoCancelButton onClick={() => setMuteRequested(false)} />
						<MuteRepoButton
							onClick={() => {
								setMuteRequested(false);
								muteRepo(note.repositoryFullName);
							}}
						/>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className={noteClasses.join(' ')} onClick={onClick}>
			<div className={iconClasses.join(' ')}>
				<Gridicon icon={iconType} />
				<span className="notification__type--text">{iconText}</span>
			</div>
			<div className="notification__image">
				{isUnread && <span className="notification__new-dot" />}
				<EnsuredImage src={avatarSrc} />
			</div>
			<div className="notification__body">
				<div className="notification__repo">
					<span className="notification__repo-name">
						{note.repositoryFullName}
					</span>
					{isMuted ? (
						<UnmuteRepoButton onClick={doUnmute} />
					) : (
						<MuteRepoRequestButton onClick={doMute} />
					)}
				</div>
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

function MuteRepoCancelButton({ onClick }) {
	return (
		<button
			className="notification__mute-confirm__cancel"
			aria-label="Cancel mute repo"
			onClick={onClick}
		>
			Cancel
		</button>
	);
}

function MuteRepoButton({ onClick }) {
	return (
		<button
			className="notification__mute-confirm__confirm"
			aria-label="Mute notifications from this repo"
			onClick={onClick}
		>
			Mute repo
		</button>
	);
}

function MuteRepoRequestButton({ onClick }) {
	return (
		<button
			className="notification__mute-repo"
			aria-label="Mute notifications from this repo"
			onClick={onClick}
		>
			mute repo
		</button>
	);
}

function UnmuteRepoButton({ onClick }) {
	return (
		<button
			className="notification__mute-repo"
			aria-label="Unmute notifications from this repo"
			onClick={onClick}
		>
			unmute repo
		</button>
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

function getNoteClasses({ isMuted, isUnread }) {
	if (isMuted) {
		return ['notification__muted'];
	}
	if (isUnread) {
		return ['notification__unread'];
	}
	return ['notification__read'];
}
