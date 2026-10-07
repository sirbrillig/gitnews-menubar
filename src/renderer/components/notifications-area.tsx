import React from 'react';
import Gridicon from 'gridicons';
import debugFactory from 'debug';
import { useDispatch, useSelector } from 'react-redux';
import Notification from '../components/notification';
import UnsubscribedNotices from '../components/unsubscribed-notice';
import FeatureTip from '../components/feature-tip';
import {
	getNoteId,
	getLowPriorityOptions,
	isNoteLowPriority,
	groupNotesByRepo,
	wouldDismissalMakeNoteLowPriority,
} from '../lib/helpers';
import { dismissFeatureTip, setLowPriorityEnabled } from '../lib/reducer';
import { runWithViewTransition } from '../lib/view-transitions';
import { useGetGitnewsUpdate } from '../lib/updates';
import doesNoteMatchFilter from '../lib/does-note-match-filter';
import {
	AppReduxState,
	FilterType,
	MarkRead,
	MarkUnread,
	MuteRepo,
	Note,
	OpenUrl,
	UnmuteRepo,
	UnsubscribeNote,
	QueuedAction,
} from '../types';

const debug = debugFactory('gitnews-menubar');

function NoNotificationsIcon({ children }: { children: React.ReactNode }) {
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
	unsubscribeNote,
	openUrl,
	token,
	searchValue,
	filterType,
	appVisible,
	isMultiOpenMode,
	setMultiOpenMode,
	showListSettings,
}: {
	newNotes: Note[];
	readNotes: Note[];
	markRead: MarkRead;
	muteRepo: MuteRepo;
	unmuteRepo: UnmuteRepo;
	mutedRepos: string[];
	markUnread: MarkUnread;
	unsubscribeNote: UnsubscribeNote;
	openUrl: OpenUrl;
	token: string;
	searchValue: string;
	filterType: FilterType;
	appVisible: boolean;
	isMultiOpenMode: boolean;
	setMultiOpenMode: (isActive: boolean) => void;
	showListSettings: () => void;
}) {
	const { isUpdateAvailable, updateUrl, updatedVersion } =
		useGetGitnewsUpdate();

	type QueuedNote = { note: Note; action: QueuedAction };
	const [queuedNotes, setQueuedNotes] = React.useState<Map<string, QueuedNote>>(
		new Map()
	);

	const queueNoteAction = (note: Note, action: QueuedAction) => {
		const noteId = getNoteId(note);
		setQueuedNotes((queue) => {
			const newQueue = new Map(queue);
			const existing = newQueue.get(noteId);
			// If note is already queued with the same action, remove it (toggle off)
			if (existing && existing.action === action) {
				newQueue.delete(noteId);
			} else {
				// Otherwise, set or update the action for this note
				newQueue.set(noteId, { note, action });
			}
			return newQueue;
		});
	};

	const processQueuedNotes = React.useCallback(() => {
		if (queuedNotes.size === 0) return;

		debug('processing queued notes', queuedNotes);
		queuedNotes.forEach(({ note, action }) => {
			switch (action) {
				case 'open':
					openUrl(note.commentUrl || note.subjectUrl, { token, note });
					break;
				case 'markRead':
					markRead(token, note, 'dismiss');
					break;
				case 'markUnread':
					markUnread(note);
					break;
			}
		});
		setQueuedNotes(new Map());
	}, [queuedNotes, openUrl, markRead, markUnread, token]);
	const onKeyUp = React.useCallback((event: KeyboardEvent) => {
		debug('Notification keyUp', event.code);
		if (event.code.includes('Meta')) {
			setMultiOpenMode(false);
		}
	}, []);
	const onKeyDown = React.useCallback(
		(event: KeyboardEvent) => {
			if (event.code.includes('Meta') && !event.shiftKey) {
				setMultiOpenMode(true);
			}
		},
		[setMultiOpenMode]
	);

	React.useEffect(() => {
		if (!isMultiOpenMode && queuedNotes.size > 0) {
			processQueuedNotes();
		}
	}, [isMultiOpenMode, processQueuedNotes, queuedNotes]);

	React.useEffect(() => {
		if (!appVisible) {
			setMultiOpenMode(false);
			setIsLowPriorityTipConfirming(false);
		}
	}, [appVisible]);
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

	const [muteRequestedFor, setMuteRequested] = React.useState<Note | false>(
		false
	);
	const [unsubscribeRequestedFor, setUnsubscribeRequested] = React.useState<
		Note | false
	>(false);

	const hasUnsubscribedNotices = useSelector(
		(state: AppReduxState) => (state.recentlyUnsubscribed ?? []).length > 0
	);

	const isLowPriorityEnabled = useSelector(
		(state: AppReduxState) => state.isLowPriorityEnabled
	);
	const lowPriorityTitlePatterns = useSelector(
		(state: AppReduxState) => state.lowPriorityTitlePatterns
	);
	const lowPriorityOptions = getLowPriorityOptions({
		isLowPriorityEnabled,
		lowPriorityTitlePatterns,
	});

	const dispatch = useDispatch();
	const isLowPriorityTipDismissed = useSelector((state: AppReduxState) =>
		(state.dismissedFeatureTips ?? []).includes('low-priority')
	);
	// After the setting is turned on from the tip, keep showing it as a
	// confirmation until it is closed or the app is hidden.
	const [isLowPriorityTipConfirming, setIsLowPriorityTipConfirming] =
		React.useState(false);

	const isGroupByRepoEnabled = useSelector(
		(state: AppReduxState) => state.isGroupByRepoEnabled
	);

	const isNoteVisible = (note: Note) =>
		doesNoteMatchSearch(note, searchValue) &&
		doesNoteMatchFilter(note, filterType);
	const visibleUnreadNotes = newNotes.filter(isNoteVisible);
	const visibleReadNotes = readNotes.filter(isNoteVisible);
	const markNotesRead = (notes: Note[]) => {
		runWithViewTransition(() =>
			notes.forEach((note) => markRead(token, note, 'dismiss'))
		);
	};

	// Suggest the low priority setting when a note the user dismissed comes back
	// because of activity that the setting would have de-prioritized.
	const shouldOfferLowPriorityTip =
		isLowPriorityTipConfirming ||
		(!isLowPriorityEnabled && !isLowPriorityTipDismissed);
	const lowPriorityTipNote = shouldOfferLowPriorityTip
		? visibleUnreadNotes.find((note) =>
				wouldDismissalMakeNoteLowPriority(note, lowPriorityTitlePatterns)
			)
		: undefined;
	const lowPriorityTip = isLowPriorityTipConfirming ? (
		<FeatureTip
			actionLabel="Undo"
			dismissLabel="OK"
			onAction={() => {
				dispatch(setLowPriorityEnabled(false));
				setIsLowPriorityTipConfirming(false);
			}}
			onDismiss={() => setIsLowPriorityTipConfirming(false)}
		>
			Moved to low priority.
		</FeatureTip>
	) : (
		<FeatureTip
			actionLabel="Turn on"
			dismissLabel="No thanks"
			onLearnMore={showListSettings}
			onAction={() => {
				dispatch(setLowPriorityEnabled(true));
				dispatch(dismissFeatureTip('low-priority'));
				setIsLowPriorityTipConfirming(true);
			}}
			onDismiss={() => dispatch(dismissFeatureTip('low-priority'))}
		>
			Updated soon after you dismissed it. Show updates like this as low
			priority?
		</FeatureTip>
	);
	const renderNote = (note: Note) => {
		const queuedAction = queuedNotes.get(getNoteId(note))?.action;
		return (
			<Notification
				note={note}
				key={getNoteId(note)}
				markRead={markRead}
				markUnread={markUnread}
				unsubscribeNote={unsubscribeNote}
				token={token}
				openUrl={openUrl}
				muteRepo={muteRepo}
				unmuteRepo={unmuteRepo}
				isMuted={mutedRepos.includes(note.repositoryFullName)}
				isMuteRequested={muteRequestedFor === note}
				setMuteRequested={setMuteRequested}
				isUnsubscribeRequested={unsubscribeRequestedFor === note}
				setUnsubscribeRequested={setUnsubscribeRequested}
				isMultiOpenMode={isMultiOpenMode}
				queueNoteAction={queueNoteAction}
				queuedAction={queuedAction}
				tip={note === lowPriorityTipNote ? lowPriorityTip : undefined}
			/>
		);
	};

	const lowPriorityNotes = visibleUnreadNotes.filter((note) =>
		isNoteLowPriority(note, lowPriorityOptions)
	);
	const lowPriorityDivider = (
		<NotesDivider
			key="low-priority-divider"
			label="Low priority"
			isCaps
			count={lowPriorityNotes.length}
			markAllRead={() => markNotesRead(lowPriorityNotes)}
		/>
	);

	const noteRows: React.ReactNode[] = [];
	if (isGroupByRepoEnabled) {
		// Low priority notes get their own section below the repo groups rather
		// than being mixed into them.
		const normalPriorityNotes = visibleUnreadNotes.filter(
			(note) => !lowPriorityNotes.includes(note)
		);
		groupNotesByRepo(normalPriorityNotes).forEach((group) => {
			noteRows.push(
				<NotesDivider
					key={`repo-divider-${group.repositoryFullName}`}
					label={group.repositoryFullName}
					count={group.notes.length}
					markAllRead={() => markNotesRead(group.notes)}
				/>,
				...group.notes.map(renderNote)
			);
		});
		if (lowPriorityNotes.length > 0) {
			noteRows.push(lowPriorityDivider, ...lowPriorityNotes.map(renderNote));
		}
		if (visibleUnreadNotes.length > 0 && visibleReadNotes.length > 0) {
			noteRows.push(<NotesDivider key="read-divider" label="Read" isCaps />);
		}
		noteRows.push(...visibleReadNotes.map(renderNote));
	} else {
		// Low priority notes are sorted together below the other unread notes,
		// so put a divider above the first one.
		[...visibleUnreadNotes, ...visibleReadNotes].forEach((note) => {
			if (note === lowPriorityNotes[0]) {
				noteRows.push(lowPriorityDivider);
			}
			noteRows.push(renderNote(note));
		});
	}

	return (
		<div className="notifications-area">
			{newNotes.length === 0 && readNotes.length === 0 && <NoNotifications />}
			{noteRows}
			{isMultiOpenMode && <MultiOpenNotice />}
			<UnsubscribedNotices openUrl={openUrl} />
			{isUpdateAvailable && !hasUnsubscribedNotices && (
				<UpdateAvailableNotice
					url={updateUrl}
					newVersion={updatedVersion}
					openUrl={openUrl}
				/>
			)}
		</div>
	);
}

function doesNoteMatchSearch(note: Note, searchValue: string) {
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

function isNoteInNotes(note: Note, notes: Note[]) {
	return notes.some((item) => getNoteId(item) === getNoteId(note));
}

function NotesDivider({
	label,
	count,
	isCaps,
	markAllRead,
}: {
	label: string;
	count?: number;
	isCaps?: boolean;
	markAllRead?: () => void;
}) {
	const [isConfirming, setIsConfirming] = React.useState(false);
	return (
		<div className="notes-divider">
			<span
				className={
					isCaps
						? 'notes-divider__label notes-divider__label--caps'
						: 'notes-divider__label'
				}
			>
				{label}
				{count !== undefined && ` (${count})`}
			</span>
			{markAllRead &&
				(isConfirming ? (
					<span className="notes-divider__actions">
						<span>Mark {count} read?</span>
						<button
							className="notes-divider__button"
							onClick={() => {
								setIsConfirming(false);
								markAllRead();
							}}
						>
							Yes
						</button>
						<button
							className="notes-divider__button"
							onClick={() => setIsConfirming(false)}
						>
							Cancel
						</button>
					</span>
				) : (
					<button
						className="notes-divider__button"
						onClick={() => setIsConfirming(true)}
					>
						Mark all read
					</button>
				))}
		</div>
	);
}

function MultiOpenNotice() {
	return (
		<div className="multi-open-notice">
			<span>
				Click multiple notifications to open or mark as read, then release the
				Command key
			</span>
		</div>
	);
}

function UpdateAvailableNotice({
	url,
	newVersion,
	openUrl,
}: {
	url: string;
	newVersion: string;
	openUrl: OpenUrl;
}) {
	return (
		<div className="update-available-notice">
			<span>
				<button
					onClick={() => openUrl(url)}
				>{`A new version (${newVersion}) of Gitnews is available.`}</button>
			</span>
		</div>
	);
}
