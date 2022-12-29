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
	openUrl,
	token,
	searchValue,
	filterType,
	appVisible,
}: {
	newNotes: Note[];
	readNotes: Note[];
	markRead: MarkRead;
	muteRepo: MuteRepo;
	unmuteRepo: UnmuteRepo;
	mutedRepos: string[];
	markUnread: MarkUnread;
	openUrl: OpenUrl;
	token: string;
	searchValue: string;
	filterType: FilterType;
	appVisible: boolean;
}) {
	const { isUpdateAvailable, updateUrl, updatedVersion } =
		useGetGitnewsUpdate();
	const [notesToOpen, setNotesToOpen] = React.useState<Note[]>([]);
	const [isMultiOpenMode, setMultiOpenMode] = React.useState(false);
	const saveNoteToOpen = (note: Note) => {
		if (isNoteInNotes(note, notesToOpen)) {
			setNotesToOpen((notes) =>
				notes.filter((noteToOpen) => noteToOpen !== note)
			);
			return;
		}
		setNotesToOpen((notes) => [...notes, note]);
	};

	const openSavedNotes = React.useCallback(() => {
		debug('opening notes', notesToOpen);
		notesToOpen.forEach((note) => {
			markRead(token, note);
			openUrl(note.commentUrl);
		});
		setNotesToOpen([]);
	}, [notesToOpen, openUrl, markRead, token]);
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
		if (!isMultiOpenMode && notesToOpen.length > 0) {
			openSavedNotes();
		}
	}, [isMultiOpenMode, openSavedNotes, notesToOpen]);

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

	const orderedNotes = [...newNotes, ...readNotes]
		.filter((note) => doesNoteMatchSearch(note, searchValue))
		.filter((note) => doesNoteMatchFilter(note, filterType));
	const noteRows = orderedNotes.map((note) => (
		<Notification
			note={note}
			key={getNoteId(note)}
			markRead={markRead}
			markUnread={markUnread}
			token={token}
			openUrl={openUrl}
			muteRepo={muteRepo}
			unmuteRepo={unmuteRepo}
			isMuted={mutedRepos.includes(note.repositoryFullName)}
			isMuteRequested={muteRequestedFor === note}
			setMuteRequested={setMuteRequested}
			isMultiOpenMode={isMultiOpenMode}
			saveNoteToOpen={saveNoteToOpen}
			isMultiOpenPending={isNoteInNotes(note, notesToOpen)}
		/>
	));

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
	return notes.some((item) => item.id === note.id);
}

function MultiOpenNotice() {
	return (
		<div className="multi-open-notice">
			<span>Click multiple notifications then release the Command key</span>
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
