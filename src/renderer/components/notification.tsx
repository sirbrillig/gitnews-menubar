import React from 'react';
import Gridicon from 'gridicons';
import debugFactory from 'debug';
import { formatDistanceToNow } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import MuteIcon from './mute-icon';
import {
	AppReduxState,
	Note,
	OpenUrl,
	MarkRead,
	MarkUnread,
	MuteRepo,
	UnmuteRepo,
	UnsubscribeNote,
	QueuedAction,
	ContextMenuItem,
} from '../types';
import type { ReviewState } from '../../shared-types';
import { ImageWithBackup } from './image-with-backup';
import {
	getNoteId,
	getLowPriorityReason,
	getLowPriorityOptions,
	hasRecentMention,
	LowPriorityReason,
} from '../lib/helpers';
import {
	runWithViewTransition,
	useVisibleViewTransitionName,
} from '../lib/view-transitions';
import { setNotePriority } from '../lib/reducer';

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
	tip,
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
	/**
	 * A tip about this note, shown inside it so it is clear which note it is
	 * about.
	 */
	tip?: React.ReactNode;
}) {
	const isUnread =
		note.unread === true ? true : note.gitnewsMarkedUnread === true;
	const isLowPriorityEnabled = useSelector(
		(state: AppReduxState) => state.isLowPriorityEnabled
	);
	const lowPriorityTitlePatterns = useSelector(
		(state: AppReduxState) => state.lowPriorityTitlePatterns
	);
	const lowPriorityCommentPatterns = useSelector(
		(state: AppReduxState) => state.lowPriorityCommentPatterns
	);
	const lowPriorityWindowHours = useSelector(
		(state: AppReduxState) => state.lowPriorityWindowHours
	);
	const lowPriorityOptions = getLowPriorityOptions({
		isLowPriorityEnabled,
		lowPriorityTitlePatterns,
		lowPriorityCommentPatterns,
		lowPriorityWindowHours,
	});
	const lowPriorityReason = getLowPriorityReason(note, lowPriorityOptions);
	const isLowPriority = Boolean(lowPriorityReason);
	const dispatch = useDispatch();
	const [isPreviewOpen, setPreviewOpen] = React.useState(false);

	const onClick = () => {
		debug('clicked on notification', note);
		setMuteRequested(false);
		setUnsubscribeRequested(false);
		setPreviewOpen(false);
		if (isMultiOpenMode) {
			queueNoteAction(note, 'open');
			return;
		}
		openUrl(note.commentUrl || note.subjectUrl, { token, note });
	};

	const onClickMarkRead = (event: React.MouseEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.stopPropagation();
		debug('clicked mark-as-read button', note);
		setMuteRequested(false);
		setUnsubscribeRequested(false);
		setPreviewOpen(false);
		if (isMultiOpenMode) {
			queueNoteAction(note, 'markRead');
			return;
		}
		runWithViewTransition(() => markRead(token, note, 'dismiss'));
	};

	const onClickMarkUnread = (event: React.MouseEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.stopPropagation();
		debug('clicked mark-as-unread button', note);
		setMuteRequested(false);
		setUnsubscribeRequested(false);
		setPreviewOpen(false);
		if (isMultiOpenMode) {
			queueNoteAction(note, 'markUnread');
			return;
		}
		runWithViewTransition(() => markUnread(note));
	};

	const lastUpdated = new Date(note.updatedAt);
	const timeString = formatDistanceToNow(lastUpdated, { addSuffix: true });
	const RECENTLY_OPENED_MS = 30 * 60 * 1000; // 30 minutes
	const openedRecentlyAt =
		note.gitnewsOpenedAt &&
		Date.now() - note.gitnewsOpenedAt < RECENTLY_OPENED_MS
			? note.gitnewsOpenedAt
			: null;
	const isMention = note.api.notification?.reason === 'mention';
	const isRecentMention = isMention && hasRecentMention(note);
	const mentionLabel = isRecentMention
		? 'You were mentioned recently'
		: 'You were mentioned earlier in this thread';
	const isInvalid = note.gitnewsIsInvalid === true;
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
		...getNoteClasses({ isUnread, isMuted, isInvalid, isLowPriority }),
	];
	const { ref: noteRef, viewTransitionName } = useVisibleViewTransitionName(
		`note-${getNoteId(note).replace(/[^\w-]/g, '_')}`
	);
	const defaultAvatar = `https://avatars.io/twitter/${note.repositoryFullName}`;
	const avatarSrc =
		note.commentAvatar || note.repositoryOwnerAvatar || defaultAvatar;
	// Show the issue or PR author alongside the latest commenter so that a bot
	// comment does not hide who opened it.
	const showAuthorAvatar = Boolean(
		note.subjectAuthorLogin &&
			note.subjectAuthorAvatar &&
			note.commentUsername &&
			note.subjectAuthorLogin.toLowerCase() !==
				note.commentUsername.toLowerCase()
	);
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

	const doMute = () => {
		setUnsubscribeRequested(false);
		setPreviewOpen(false);
		setMuteRequested(note);
	};
	const doUnmute = () => {
		setPreviewOpen(false);
		unmuteRepo(note.repositoryFullName);
	};
	const doTogglePreview = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		setPreviewOpen((isOpen) => !isOpen);
	};
	const doRequestUnsubscribe = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		setMuteRequested(false);
		setPreviewOpen(false);
		setUnsubscribeRequested(note);
	};
	// Less frequent actions live in a native menu, opened by the actions button
	// or by right-clicking the note, so they don't crowd the footer.
	const doShowActionsMenu = async (event: React.MouseEvent<HTMLElement>) => {
		event.preventDefault();
		event.stopPropagation();
		if (isMultiOpenMode) {
			return;
		}
		// Read notes are never low priority, so offer the priority actions based
		// on how the note would be shown once it is unread again.
		const noteAsUnread = isUnread ? note : { ...note, unread: true };
		const menuLowPriorityReason = getLowPriorityReason(
			noteAsUnread,
			lowPriorityOptions
		);
		const choice = await window.electronApi.showContextMenu([
			...getPriorityMenuItems(menuLowPriorityReason),
			isMuted
				? { id: 'unmute', label: `Unmute ${note.repositoryFullName}` }
				: { id: 'mute', label: `Mute ${note.repositoryFullName}…` },
			{ type: 'separator' },
			{ id: 'unsubscribe', label: 'Unsubscribe from thread…' },
		]);
		debug('chose note action', choice, note);
		if (choice === 'mark-low-priority') {
			runWithViewTransition(() => dispatch(setNotePriority(note, 'low')));
		} else if (choice === 'remove-low-priority') {
			// Clearing the override is enough unless the automatic rules would make
			// the note low priority again, in which case mark it normal priority.
			const isAutomaticallyLowPriority = Boolean(
				getLowPriorityReason(
					{ ...noteAsUnread, gitnewsPriorityOverride: undefined },
					lowPriorityOptions
				)
			);
			const priority = isAutomaticallyLowPriority ? 'normal' : undefined;
			runWithViewTransition(() => dispatch(setNotePriority(note, priority)));
		} else if (choice === 'mute') {
			doMute();
		} else if (choice === 'unmute') {
			doUnmute();
		} else if (choice === 'unsubscribe') {
			setMuteRequested(false);
			setPreviewOpen(false);
			setUnsubscribeRequested(note);
		}
	};

	return (
		<div
			ref={noteRef}
			className={noteClasses.join(' ')}
			style={{ viewTransitionName: viewTransitionName }}
			onContextMenu={doShowActionsMenu}
		>
			{isMuteRequested && (
				<div className="notification__mute-confirm">
					<div className="notification__mute-confirm__text">
						<div className="notification__mute-confirm__title">
							Mute {note.repositoryFullName}?
						</div>
						Muted repos won&apos;t change the icon. You can unmute later.
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
			)}
			{isUnsubscribeRequested && (
				<div className="notification__mute-confirm">
					<div className="notification__mute-confirm__text">
						<div className="notification__mute-confirm__title">
							Unsubscribe from this thread?
						</div>
						You&apos;ll stop receiving these. This can&apos;t be undone from
						Gitnews.
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
			)}
			{queuedAction === 'open' && <MultiOpenPendingNotice onClick={onClick} />}
			{queuedAction === 'markRead' && (
				<MultiMarkReadPendingNotice onClick={onClickMarkRead} />
			)}
			{queuedAction === 'markUnread' && (
				<MultiMarkUnreadPendingNotice onClick={onClickMarkUnread} />
			)}
			<div className="notification__main-content" onClick={onClick}>
				<div
					className={
						showAuthorAvatar
							? 'notification__image notification__image--stacked'
							: 'notification__image'
					}
				>
					{isUnread && (
						<span
							className={
								isLowPriority
									? 'notification__new-dot notification__new-dot--low-priority'
									: 'notification__new-dot'
							}
						/>
					)}
					{isMuted && <MuteIcon className="mute-icon" />}
					{showAuthorAvatar && note.subjectAuthorLogin ? (
						<span className="notification__avatar-stack">
							<ImageWithBackup
								src={note.subjectAuthorAvatar ?? defaultAvatar}
								username={note.subjectAuthorLogin}
								title={`Author: ${note.subjectAuthorLogin}`}
								showUsername={false}
							/>
							<ImageWithBackup
								src={avatarSrc}
								username={note.commentUsername}
								title={`Latest activity: ${note.commentUsername}`}
								showUsername={false}
							/>
							<span className="notification__avatar-stack__names">
								<span
									className="notification__avatar-stack__author"
									title={`Author: ${note.subjectAuthorLogin}`}
								>
									{note.subjectAuthorLogin}
								</span>
								<span title={`Latest activity: ${note.commentUsername}`}>
									{note.commentUsername}
								</span>
							</span>
						</span>
					) : (
						<ImageWithBackup src={avatarSrc} username={note.commentUsername} />
					)}
					{isMention && (
						<span
							className={
								isRecentMention
									? 'notification__mention-pill'
									: 'notification__mention-pill notification__mention-pill--older'
							}
							title={mentionLabel}
							aria-label={mentionLabel}
							role="img"
						>
							@
						</span>
					)}
				</div>
				<div className="notification__body">
					<div className="notification__repo">
						<span className={iconClasses.join(' ')}>
							<Gridicon icon={iconType} />
							<span className="notification__type--text">{iconText}</span>
						</span>
						{note.authoredByYou && (
							<span
								className="notification__author-icon"
								title="You created this"
								aria-label="You created this"
								role="img"
							>
								<Gridicon icon="user" />
							</span>
						)}
						{note.reviewState && (
							<ReviewStateBadge
								reviewState={note.reviewState}
								reviewer={note.commentUsername}
							/>
						)}
						<span
							className="notification__repo-name"
							title={note.repositoryFullName}
						>
							{note.repositoryFullName}
						</span>
					</div>
					<div className="notification__title" title={note.title}>
						{note.title}
					</div>
					{isInvalid && (
						<div className="notification__invalid-notice">
							⚠ Failed to load details
						</div>
					)}
					<div className="notification__footer">
						<span className="notification__time">
							{openedRecentlyAt && (
								<span
									className="notification__opened-dot"
									title={`Opened ${formatDistanceToNow(
										new Date(openedRecentlyAt),
										{ addSuffix: true }
									)}`}
								/>
							)}
							{timeString}
							{isLowPriority && (
								<span
									className="notification__low-priority-label"
									title={getLowPriorityLabelTitle(lowPriorityReason)}
								>
									{lowPriorityReason === 'dismissed' ? '· minor' : '· low'}
								</span>
							)}
						</span>
						<span className="notification__actions">
							{note.commentExcerpt && (
								<PreviewToggleButton
									isOpen={isPreviewOpen}
									onClick={doTogglePreview}
								/>
							)}
							<UnsubscribeRequestButton
								disabled={isMultiOpenMode}
								onClick={doRequestUnsubscribe}
							/>
							<NoteActionsMenuButton
								disabled={isMultiOpenMode}
								onClick={doShowActionsMenu}
							/>
						</span>
					</div>
					{isPreviewOpen && note.commentExcerpt && (
						<div className="notification__preview">
							{note.commentUsername && (
								<span className="notification__preview-author">
									@{note.commentUsername}:{' '}
								</span>
							)}
							{note.commentExcerpt}
						</div>
					)}
					{tip}
				</div>
			</div>
			<div
				className="notification__mark-read-target"
				onClick={isUnread ? onClickMarkRead : onClickMarkUnread}
				title={isUnread ? 'Mark as read' : 'Mark as unread'}
			>
				<span className="notification__mark-read-button">
					<Gridicon icon={isUnread ? 'checkmark' : 'mail'} size={18} />
				</span>
			</div>
		</div>
	);
}

function ReviewStateBadge({
	reviewState,
	reviewer,
}: {
	reviewState: ReviewState;
	reviewer: string;
}) {
	if (reviewState === 'APPROVED') {
		return (
			<span
				className="notification__review-state notification__review-state--approved"
				title={`Approved by ${reviewer}`}
				aria-label={`Approved by ${reviewer}`}
				role="img"
			>
				<Gridicon icon="checkmark" />
			</span>
		);
	}
	if (reviewState === 'CHANGES_REQUESTED') {
		return (
			<span
				className="notification__review-state notification__review-state--changes-requested"
				title={`Changes requested by ${reviewer}`}
				aria-label={`Changes requested by ${reviewer}`}
				role="img"
			>
				<Gridicon icon="cross" />
			</span>
		);
	}
	return null;
}

function getPriorityMenuItems(
	lowPriorityReason: LowPriorityReason | undefined
): ContextMenuItem[] {
	if (!lowPriorityReason) {
		return [
			{ id: 'mark-low-priority', label: 'Mark as low priority' },
			{ type: 'separator' },
		];
	}
	return [
		{
			id: 'remove-low-priority',
			label: getRemoveLowPriorityLabel(lowPriorityReason),
		},
		{ type: 'separator' },
	];
}

function getRemoveLowPriorityLabel(
	lowPriorityReason: LowPriorityReason
): string {
	switch (lowPriorityReason) {
		case 'title':
			return 'Remove low priority (ignore title pattern)';
		case 'comment':
			return 'Remove low priority (ignore comment pattern)';
		default:
			return 'Remove low priority';
	}
}

function getLowPriorityLabelTitle(
	lowPriorityReason: LowPriorityReason | undefined
): string {
	switch (lowPriorityReason) {
		case 'manual':
			return 'You marked this as low priority';
		case 'title':
			return 'The title matches a low priority pattern for this repo';
		case 'comment':
			return 'The latest comment matches a low priority pattern for this repo';
		default:
			return 'You dismissed this recently without opening it, so this update is probably minor';
	}
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

function NoteActionsMenuButton({
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
			className="notification__actions-menu"
			aria-label="More actions"
			aria-haspopup="menu"
			title="More actions"
			onClick={onClick}
		>
			<Gridicon icon="ellipsis" size={12} />
		</button>
	);
}

function PreviewToggleButton({
	isOpen,
	onClick,
}: {
	isOpen: boolean;
	onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
	return (
		<button
			className="notification__preview-toggle"
			aria-label={isOpen ? 'Hide comment preview' : 'Show comment preview'}
			aria-expanded={isOpen}
			title={isOpen ? 'Hide comment preview' : 'Show comment preview'}
			onClick={onClick}
		>
			<Gridicon
				icon="chevron-right"
				size={12}
				className={
					'notification__preview-toggle-icon' +
					(isOpen ? ' notification__preview-toggle-icon--open' : '')
				}
			/>
			<span className="notification__preview-toggle-text">preview</span>
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
	isInvalid,
	isLowPriority,
}: {
	isMuted?: boolean;
	isUnread?: boolean;
	isInvalid?: boolean;
	isLowPriority?: boolean;
}) {
	if (isMuted) {
		return ['notification__muted'];
	}
	if (isInvalid) {
		return ['notification__invalid'];
	}
	if (isUnread && isLowPriority) {
		return ['notification__unread', 'notification__low-priority'];
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
