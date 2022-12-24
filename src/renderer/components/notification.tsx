import React from 'react';
import Gridicon from 'gridicons';
import debugFactory from 'debug';
import date from 'date-fns';
import EnsuredImage from './ensured-image';
import MuteIcon from './mute-icon';
import {
	Note,
	OpenUrl,
	MarkRead,
	MarkUnread,
	MuteRepo,
	UnmuteRepo,
} from '../types';

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
	isMultiOpenPending,
	saveNoteToOpen,
}: {
	note: Note;
	openUrl: OpenUrl;
	markRead: MarkRead;
	markUnread: MarkUnread;
	token: string;
	muteRepo: MuteRepo;
	unmuteRepo: UnmuteRepo;
	isMuted: boolean;
	isMuteRequested: boolean;
	setMuteRequested: (n: Note | false) => void;
	isMultiOpenMode: boolean;
	isMultiOpenPending: boolean;
	saveNoteToOpen: (n: Note) => void;
}) {
	const isUnread =
		note.unread === true ? true : note.gitnewsMarkedUnread === true;

	const onClick = () => {
		debug('clicked on notification', note);
		setMuteRequested(false);
		if (isMultiOpenMode) {
			saveNoteToOpen(note);
			return;
		}
		markRead(token, note);
		openUrl(note.commentUrl);
	};

	const timeString = date.distanceInWords(
		Date.now(),
		date.parse(note.updatedAt),
		{ addSuffix: true }
	);
	const noteClasses = [
		'notification',
		...(isMultiOpenMode && !isMultiOpenPending
			? ['notification--multi-open']
			: []),
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

	const doMute = () => {
		setMuteRequested(note);
	};
	const doUnmute = () => {
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
						<MuteRepoCancelButton
							disabled={isMultiOpenMode}
							onClick={() => setMuteRequested(false)}
						/>
						<MuteRepoButton
							disabled={isMultiOpenMode}
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
							<UnmuteRepoButton disabled={isMultiOpenMode} onClick={doUnmute} />
						) : (
							<MuteRepoRequestButton
								disabled={isMultiOpenMode}
								onClick={doMute}
							/>
						)}
						{isUnread ? (
							<MarkReadButton
								disabled={isMultiOpenMode}
								note={note}
								token={token}
								markRead={markRead}
							/>
						) : (
							<MarkUnreadButton
								disabled={isMultiOpenMode}
								note={note}
								markUnread={markUnread}
							/>
						)}
					</span>
				</div>
			</div>
		</div>
	);
}

function MuteRepoCancelButton({
	onClick,
	disabled,
}: {
	onClick: () => void;
	disabled?: boolean;
}) {
	return (
		<button
			className="notification__mute-confirm__cancel btn--cancel"
			aria-label="Cancel mute repo"
			onClick={onClick}
			disabled={disabled}
		>
			Cancel
		</button>
	);
}

function MuteRepoButton({
	onClick,
	disabled,
}: {
	onClick: () => void;
	disabled?: boolean;
}) {
	return (
		<button
			className="notification__mute-confirm__confirm btn"
			aria-label="Mute notifications from this repo"
			onClick={onClick}
			disabled={disabled}
		>
			Mute repo
		</button>
	);
}

function MuteRepoRequestButton({
	onClick,
	disabled,
}: {
	onClick: () => void;
	disabled?: boolean;
}) {
	if (disabled) {
		return null;
	}
	return (
		<button
			className="notification__mute-repo"
			aria-label="Mute notifications from this repo"
			onClick={onClick}
			disabled={disabled}
		>
			mute repo
		</button>
	);
}

function UnmuteRepoButton({
	onClick,
	disabled,
}: {
	onClick: () => void;
	disabled?: boolean;
}) {
	if (disabled) {
		return null;
	}
	return (
		<button
			className="notification__mute-repo"
			aria-label="Unmute notifications from this repo"
			onClick={onClick}
			disabled={disabled}
		>
			unmute repo
		</button>
	);
}

function MarkReadButton({
	note,
	token,
	markRead,
	disabled,
}: {
	note: Note;
	token: string;
	markRead: MarkRead;
	disabled?: boolean;
}) {
	const onClick = () => {
		debug('clicked to mark notification as read', note);
		markRead(token, note);
	};
	if (disabled) {
		return null;
	}
	return (
		<button
			className="notification__mark-read"
			onClick={onClick}
			aria-label="Mark notification as read"
			disabled={disabled}
		>
			mark read
		</button>
	);
}

function MarkUnreadButton({
	note,
	markUnread,
	disabled,
}: {
	note: Note;
	markUnread: MarkUnread;
	disabled?: boolean;
}) {
	const onClick = () => {
		debug('clicked to mark notification as unread', note);
		markUnread(note);
	};
	if (disabled) {
		return null;
	}
	return (
		<button
			className="notification__mark-unread"
			onClick={onClick}
			aria-label="Mark as unread"
			disabled={disabled}
		>
			mark unread
		</button>
	);
}

function getNoteClasses({
	isMuted,
	isUnread,
}: {
	isMuted?: boolean;
	isUnread?: boolean;
}) {
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
		<div className="multi-open-pending-notice">Release Command key to open</div>
	);
}
