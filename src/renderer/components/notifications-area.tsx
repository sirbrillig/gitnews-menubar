import React from 'react';
import Gridicon from 'gridicons';
import debugFactory from 'debug';
import Notification from '../components/notification';
import { getNoteId } from '../lib/helpers';
import { useGetGitnewsUpdate } from '../lib/updates';
import doesNoteMatchFilter from '../lib/does-note-match-filter';
import {
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
					markRead(token, note);
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
			if (event.code.includes('Meta')) {
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

	const orderedNotes = [...newNotes, ...readNotes]
		.filter((note) => doesNoteMatchSearch(note, searchValue))
		.filter((note) => doesNoteMatchFilter(note, filterType));
	const noteRows = orderedNotes.map((note) => {
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
			/>
		);
	});

	return (
		<div className="notifications-area">
			{newNotes.length === 0 && readNotes.length === 0 && <NoNotifications />}
			{noteRows}
			{isMultiOpenMode && <MultiOpenNotice />}
			{isUpdateAvailable && (
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
