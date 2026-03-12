import React from 'react';
import Gridicon from 'gridicons';
import debugFactory from 'debug';
import { formatDistanceToNow } from 'date-fns';
import MuteIcon from './mute-icon';
import {
	Note,
	OpenUrl,
	MarkRead,
	MarkUnread,
	MuteRepo,
	UnmuteRepo,
	UnsubscribeNote,
	QueuedAction,
} from '../types';
import { ImageWithBackup } from './image-with-backup';

const debug = debugFactory('gitnews-menubar');

export default function Notification({
	note,
	openUrl,
	markRead,
	markUnread,
	unsubscribeNote,
	token,
	muteRepo,
	unmuteRepo,
	isMuted,
	isMuteRequested,
	setMuteRequested,
	isUnsubscribeRequested,
	setUnsubscribeRequested,
	isMultiOpenMode,
	queueNoteAction,
	queuedAction,
}: {
	note: Note;
	openUrl: OpenUrl;
	markRead: MarkRead;
	markUnread: MarkUnread;
	unsubscribeNote: UnsubscribeNote;
	token: string;
	muteRepo: MuteRepo;
	unmuteRepo: UnmuteRepo;
	isMuted: boolean;
	isMuteRequested: boolean;
	setMuteRequested: (n: Note | false) => void;
	isUnsubscribeRequested: boolean;
	setUnsubscribeRequested: (n: Note | false) => void;
	isMultiOpenMode: boolean;
	queueNoteAction: (note: Note, action: QueuedAction) => void;
	queuedAction?: QueuedAction;
}) {
	const isUnread =
		note.unread === true ? true : note.gitnewsMarkedUnread === true;

	const onClick = () => {
		debug('clicked on notification', note);
		setMuteRequested(false);
		setUnsubscribeRequested(false);
		if (isMultiOpenMode) {
			queueNoteAction(note, 'open');
			return;
		}
		markRead(token, note);
		openUrl(note.commentUrl);
	};

	const onClickMarkRead = (event: React.MouseEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.stopPropagation();
		debug('clicked mark-as-read button', note);
		setMuteRequested(false);
		setUnsubscribeRequested(false);
		if (isMultiOpenMode) {
			queueNoteAction(note, 'markRead');
			return;
		}
		markRead(token, note);
	};

	const onClickMarkUnread = (event: React.MouseEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.stopPropagation();
		debug('clicked mark-as-unread button', note);
		setMuteRequested(false);
		setUnsubscribeRequested(false);
		if (isMultiOpenMode) {
			queueNoteAction(note, 'markUnread');
			return;
		}
		markUnread(note);
	};

	const lastUpdated = new Date(note.updatedAt);
	const timeString = formatDistanceToNow(lastUpdated, { addSuffix: true });
	const isMention = note.api.notification?.reason === 'mention';
	const noteClasses = [
		'notification',
		...(isMultiOpenMode && !queuedAction ? ['notification--multi-open'] : []),
		...(queuedAction === 'open' ? ['notification--multi-open-clicked'] : []),
		...(queuedAction === 'markRead'
			? ['notification--multi-mark-read-clicked']
			: []),
		...(queuedAction === 'markUnread'
			? ['notification--multi-mark-unread-clicked']
			: []),
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
	const isDraft =
		note.type === 'PullRequest' &&
		!isMerged &&
		!isClosed &&
		note.api.subject?.draft === true;
	const iconType = isMerged || isClosed ? 'checkmark-circle' : 'chat';
	const iconText = isMerged || isClosed ? 'closed' : isDraft ? 'draft' : 'open';
	const iconClasses = [
		'notification__type',
		...(isClosed && !isMerged ? ['notification__type--closed'] : []),
		...(isMerged ? ['notification__type--merged'] : []),
		...(isDraft ? ['notification__type--draft'] : []),
	];

	const doMute = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		setUnsubscribeRequested(false);
		setMuteRequested(note);
	};
	const doUnmute = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		unmuteRepo(note.repositoryFullName);
	};
	const doRequestUnsubscribe = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		setMuteRequested(false);
		setUnsubscribeRequested(note);
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

	if (isUnsubscribeRequested) {
		return (
			<div className={noteClasses.join(' ')}>
				<div className="notification__mute-confirm">
					<div className="notification__mute-confirm__text">
						<div className="notification__mute-confirm__title">
							Unsubscribe from this thread?
						</div>
						You will no longer receive notifications for this thread. This
						cannot be undone from Gitnews.
					</div>
					<div className="notification__mute-confirm__buttons">
						<MuteRepoCancelButton
							disabled={isMultiOpenMode}
							onClick={() => setUnsubscribeRequested(false)}
						/>
						<UnsubscribeButton
							disabled={isMultiOpenMode}
							onClick={() => {
								setUnsubscribeRequested(false);
								unsubscribeNote(note);
							}}
						/>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className={noteClasses.join(' ')}>
			{queuedAction === 'open' && <MultiOpenPendingNotice onClick={onClick} />}
			{queuedAction === 'markRead' && (
				<MultiMarkReadPendingNotice onClick={onClickMarkRead} />
			)}
			{queuedAction === 'markUnread' && (
				<MultiMarkUnreadPendingNotice onClick={onClickMarkUnread} />
			)}
			<div className="notification__main-content" onClick={onClick}>
				<div className={iconClasses.join(' ')}>
					<Gridicon icon={iconType} />
					<span className="notification__type--text">{iconText}</span>
				</div>
				<div className="notification__image">
					{isUnread && <span className="notification__new-dot" />}
					{isMuted && <MuteIcon className="mute-icon" />}
					{isMention && <span className="notification__mention-badge">@</span>}
					<ImageWithBackup src={avatarSrc} username={note.commentUsername} />
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
								<UnmuteRepoButton
									disabled={isMultiOpenMode}
									onClick={doUnmute}
								/>
							) : (
								<MuteRepoRequestButton
									disabled={isMultiOpenMode}
									onClick={doMute}
								/>
							)}
							<UnsubscribeRequestButton
								disabled={isMultiOpenMode}
								onClick={doRequestUnsubscribe}
							/>
						</span>
					</div>
				</div>
			</div>
			<div
				className="notification__mark-read-target"
				onClick={isUnread ? onClickMarkRead : onClickMarkUnread}
				title={isUnread ? 'Mark as read' : 'Mark as unread'}
			>
				<Gridicon icon={isUnread ? 'checkmark' : 'mail'} size={18} />
			</div>
		</div>
	);
}

function MuteRepoCancelButton({
	onClick,
	disabled,
}: {
	onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
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
	onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
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
	onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
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
	onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
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

function UnsubscribeRequestButton({
	onClick,
	disabled,
}: {
	onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
	disabled?: boolean;
}) {
	if (disabled) {
		return null;
	}
	return (
		<button
			className="notification__unsubscribe"
			aria-label="Unsubscribe from this thread"
			onClick={onClick}
		>
			unsubscribe
		</button>
	);
}

function UnsubscribeButton({
	onClick,
	disabled,
}: {
	onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
	disabled?: boolean;
}) {
	return (
		<button
			className="notification__mute-confirm__confirm btn btn--destructive"
			aria-label="Unsubscribe from this thread"
			onClick={onClick}
			disabled={disabled}
		>
			Unsubscribe
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

function MultiOpenPendingNotice({ onClick }: { onClick: () => void }) {
	return (
		<div className="multi-open-pending-notice" onClick={onClick}>
			<span className="multi-open-pending-notice__icon multi-open-pending-notice--open">
				↗
			</span>
			<div>Release Command key to open</div>
			<div>(click to deselect)</div>
		</div>
	);
}

function MultiMarkReadPendingNotice({
	onClick,
}: {
	onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
}) {
	return (
		<div className="multi-open-pending-notice" onClick={onClick}>
			<span className="multi-open-pending-notice__icon multi-open-pending-notice--mark-read">
				✓
			</span>
			<div>Release Command key to mark as read</div>
			<div>(click to deselect)</div>
		</div>
	);
}

function MultiMarkUnreadPendingNotice({
	onClick,
}: {
	onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
}) {
	return (
		<div className="multi-open-pending-notice" onClick={onClick}>
			<span className="multi-open-pending-notice__icon multi-open-pending-notice--mark-unread">
				✉
			</span>
			<div>Release Command key to mark as unread</div>
			<div>(click to deselect)</div>
		</div>
	);
}
