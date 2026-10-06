import React from 'react';
import Gridicon from 'gridicons';
import debugFactory from 'debug';
import { useSelector } from 'react-redux';
import Notification from '../components/notification';
import UnsubscribedNotices from '../components/unsubscribed-notice';
import {
	getNoteId,
	getLowPriorityOptions,
	isNoteLowPriority,
} from '../lib/helpers';
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

	const orderedNotes = [...newNotes, ...readNotes]
		.filter((note) => doesNoteMatchSearch(note, searchValue))
		.filter((note) => doesNoteMatchFilter(note, filterType));
	const lowPriorityNotes = orderedNotes.filter((note) =>
		isNoteLowPriority(note, lowPriorityOptions)
	);
	const markLowPriorityNotesRead = () => {
		runWithViewTransition(() =>
			lowPriorityNotes.forEach((note) => markRead(token, note, 'dismiss'))
		);
	};
	const noteRows = orderedNotes.map((note) => {
		const queuedAction = queuedNotes.get(getNoteId(note))?.action;
		const notification = (
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
			/>
		);
		// Low priority notes are sorted together below the other unread notes, so
		// put a divider above the first one.
		if (note === lowPriorityNotes[0]) {
			return (
				<React.Fragment key={getNoteId(note)}>
					<LowPriorityDivider
						count={lowPriorityNotes.length}
						markAllRead={markLowPriorityNotesRead}
					/>
					{notification}
				</React.Fragment>
			);
		}
		return notification;
	});

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

function LowPriorityDivider({
	count,
	markAllRead,
}: {
	count: number;
	markAllRead: () => void;
}) {
	const [isConfirming, setIsConfirming] = React.useState(false);
	return (
		<div className="low-priority-divider">
			<span className="low-priority-divider__label">
				Low priority ({count})
			</span>
			{isConfirming ? (
				<span className="low-priority-divider__actions">
					<span>Mark {count} read?</span>
					<button
						className="low-priority-divider__button"
						onClick={() => {
							setIsConfirming(false);
							markAllRead();
						}}
					>
						Yes
					</button>
					<button
						className="low-priority-divider__button"
						onClick={() => setIsConfirming(false)}
					>
						Cancel
					</button>
				</span>
			) : (
				<button
					className="low-priority-divider__button"
					onClick={() => setIsConfirming(true)}
				>
					Mark all read
				</button>
			)}
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
