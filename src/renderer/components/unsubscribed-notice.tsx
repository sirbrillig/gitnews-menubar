import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Gridicon from 'gridicons';
import { dismissUnsubscribedNotice, undoUnsubscribeNote } from '../lib/reducer';
import { getNoteId } from '../lib/helpers';
import { AppReduxState, OpenUrl, RecentlyUnsubscribedNote } from '../types';

// Long enough to notice and react, since after this there is no way to find
// the thread again from the app.
export const UNSUBSCRIBED_NOTICE_DURATION_MS = 30 * 1000;
const TICK_MS = 1000;

export default function UnsubscribedNotices({ openUrl }: { openUrl: OpenUrl }) {
	const recentlyUnsubscribed = useSelector(
		(state: AppReduxState) => state.recentlyUnsubscribed ?? []
	);
	const dispatch = useDispatch();
	const [now, setNow] = React.useState(Date.now());

	// The window may be hidden and shown again while a notice is active; the
	// timer is based on wall-clock time so it keeps counting down regardless.
	React.useEffect(() => {
		if (recentlyUnsubscribed.length === 0) {
			return;
		}
		setNow(Date.now());
		const interval = setInterval(() => setNow(Date.now()), TICK_MS);
		return () => clearInterval(interval);
	}, [recentlyUnsubscribed.length]);

	React.useEffect(() => {
		recentlyUnsubscribed
			.filter((item) => getRemainingMs(item, now) <= 0)
			.forEach((item) =>
				dispatch(dismissUnsubscribedNotice(getNoteId(item.note)))
			);
	}, [now, recentlyUnsubscribed]);

	const activeItems = recentlyUnsubscribed.filter(
		(item) => getRemainingMs(item, now) > 0
	);
	if (activeItems.length === 0) {
		return null;
	}
	return (
		<div className="unsubscribed-notices">
			{activeItems.map((item) => (
				<UnsubscribedNotice
					key={getNoteId(item.note)}
					item={item}
					remainingMs={getRemainingMs(item, now)}
					openUrl={openUrl}
					dismiss={() =>
						dispatch(dismissUnsubscribedNotice(getNoteId(item.note)))
					}
					undo={() => dispatch(undoUnsubscribeNote(item.note))}
				/>
			))}
		</div>
	);
}

function getRemainingMs(item: RecentlyUnsubscribedNote, now: number): number {
	return item.unsubscribedAt + UNSUBSCRIBED_NOTICE_DURATION_MS - now;
}

function UnsubscribedNotice({
	item,
	remainingMs,
	openUrl,
	dismiss,
	undo,
}: {
	item: RecentlyUnsubscribedNote;
	remainingMs: number;
	openUrl: OpenUrl;
	dismiss: () => void;
	undo: () => void;
}) {
	const { note } = item;
	const url = note.commentUrl || note.subjectUrl;
	// After the first paint, render the bar at where it will be on the next tick
	// and let a linear transition of the same length animate it there, so it
	// moves smoothly.
	const [hasPainted, setHasPainted] = React.useState(false);
	React.useEffect(() => {
		const frame = requestAnimationFrame(() => setHasPainted(true));
		return () => cancelAnimationFrame(frame);
	}, []);
	const nextRemainingMs = hasPainted
		? Math.max(0, remainingMs - TICK_MS)
		: remainingMs;
	const percentRemaining =
		(nextRemainingMs / UNSUBSCRIBED_NOTICE_DURATION_MS) * 100;
	return (
		<div className="unsubscribed-notice" role="status">
			<div className="unsubscribed-notice__body">
				<span className="unsubscribed-notice__message">
					<span className="unsubscribed-notice__prefix">Unsubscribed from</span>
					<button
						className="unsubscribed-notice__link"
						onClick={() => openUrl(url)}
						title={`${note.repositoryFullName}: ${note.title}`}
					>
						{note.title}
					</button>
				</span>
				<button className="unsubscribed-notice__undo" onClick={undo}>
					Undo
				</button>
				<button
					className="unsubscribed-notice__dismiss"
					onClick={dismiss}
					aria-label="Dismiss"
					title="Dismiss"
				>
					<Gridicon icon="cross-small" size={18} />
				</button>
			</div>
			<div className="unsubscribed-notice__timer">
				<div
					className="unsubscribed-notice__timer-bar"
					style={{
						width: `${percentRemaining}%`,
						transitionDuration: `${TICK_MS}ms`,
					}}
				/>
			</div>
		</div>
	);
}
