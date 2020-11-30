import React from 'react';
import Gridicon from 'gridicons';
import debugFactory from 'debug';
import date from 'date-fns';
import EnsuredImage from './ensured-image';
import MuteIcon from './mute-icon';

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
	isMultiOpenMode,
	saveNoteToOpen,
}) {
	const isUnread =
		note.unread === true ? true : note.gitnewsMarkedUnread === true;

	const [isMultiOpenPending, setMultiOpenPending] = React.useState(false);
	const onClick = () => {
		debug('clicked on notification', note);
		setMuteRequested(false);
		if (isMultiOpenMode) {
			setMultiOpenPending(true);
			saveNoteToOpen(note);
			return;
		}
		markRead(token, note);
		openUrl(note.commentUrl);
	};
	React.useEffect(() => {
		if (!isMultiOpenMode) {
			setMultiOpenPending(false);
		}
	}, [isMultiOpenMode]);

	const timeString = date.distanceInWords(
		Date.now(),
		date.parse(note.updatedAt),
		{ addSuffix: true }
	);
	const noteClasses = [
		'notification',
		...(isMultiOpenMode && !isMultiOpenPending ? ['notification--multi-open'] : []),
		...(isMultiOpenPending ? ['notification--multi-open-clicked'] : []),
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
						<div className="notification__mute-confirm__title">
							Mute all notifications from {note.repositoryFullName}?
						</div>
						Notifications from a muted repo will not cause the icon to change.
						You can unmute it later.
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
			{isMultiOpenPending && <MultiOpenPendingNotice />}
			<div className={iconClasses.join(' ')}>
				<Gridicon icon={iconType} />
				<span className="notification__type--text">{iconText}</span>
			</div>
			<div className="notification__image">
				{isUnread && <span className="notification__new-dot" />}
				{isMuted && <MuteIcon className="mute-icon" />}
				<EnsuredImage src={avatarSrc} />
			</div>
			<div className="notification__body">
				<div className="notification__repo">
					<span className="notification__repo-name">
						{note.repositoryFullName}
					</span>
				</div>
				<div className="notification__title">{note.title}</div>
				<div className="notification__footer">
					<span className="notification__time">{timeString}</span>
					<span className="notification__actions">
						{isMuted ? (
							<UnmuteRepoButton onClick={doUnmute} />
						) : (
							<MuteRepoRequestButton onClick={doMute} />
						)}
						{isUnread ? (
							<MarkReadButton note={note} token={token} markRead={markRead} />
						) : (
							<MarkUnreadButton note={note} markUnread={markUnread} />
						)}
					</span>
				</div>
			</div>
		</div>
	);
}

function MuteRepoCancelButton({ onClick }) {
	return (
		<button
			className="notification__mute-confirm__cancel btn--cancel"
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
			className="notification__mute-confirm__confirm btn"
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

function MultiOpenPendingNotice() {
	return (
		<div className="multi-open-pending-notice">Release meta key to open</div>
	);
}
