import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
	setLowPriorityEnabled,
	setLowPriorityWindowHours,
	setGroupByRepoEnabled,
	resetFeatureTips,
} from '../lib/reducer';
import {
	DEFAULT_LOW_PRIORITY_WINDOW_HOURS,
	LOW_PRIORITY_WINDOW_HOURS_CHOICES,
} from '../lib/helpers';
import { AppReduxState } from '../types';

function formatWindowHours(hours: number): string {
	if (hours % 24 === 0) {
		const days = hours / 24;
		return days === 7 ? '1 week' : `${days} ${days === 1 ? 'day' : 'days'}`;
	}
	return `${hours} hours`;
}

export default function ListSettingsPage({
	showMutedReposList,
	showLowPriorityTitles,
}: {
	showMutedReposList: () => void;
	showLowPriorityTitles: () => void;
}) {
	const dispatch = useDispatch();
	const isLowPriorityEnabled = useSelector(
		(state: AppReduxState) => state.isLowPriorityEnabled
	);
	const toggleLowPriority = (event: { target: { checked: boolean } }) =>
		dispatch(setLowPriorityEnabled(event.target.checked));
	const lowPriorityWindowHours =
		useSelector((state: AppReduxState) => state.lowPriorityWindowHours) ??
		DEFAULT_LOW_PRIORITY_WINDOW_HOURS;
	const windowHoursChoices = LOW_PRIORITY_WINDOW_HOURS_CHOICES.includes(
		lowPriorityWindowHours
	)
		? LOW_PRIORITY_WINDOW_HOURS_CHOICES
		: [...LOW_PRIORITY_WINDOW_HOURS_CHOICES, lowPriorityWindowHours].sort(
				(a, b) => a - b
			);
	const changeLowPriorityWindow = (event: { target: { value: string } }) =>
		dispatch(setLowPriorityWindowHours(Number(event.target.value)));
	const isGroupByRepoEnabled = useSelector(
		(state: AppReduxState) => state.isGroupByRepoEnabled
	);
	const toggleGroupByRepo = (event: { target: { checked: boolean } }) =>
		dispatch(setGroupByRepoEnabled(event.target.checked));
	const hasDismissedTips = useSelector(
		(state: AppReduxState) => (state.dismissedFeatureTips ?? []).length > 0
	);

	return (
		<div className="config-page">
			<div className="config-section">
				<div className="config-section__label">Notification list</div>
				<ul className="config-page__settings">
					<li className="config-row config-row--toggle">
						<div>
							<label htmlFor="group-by-repo-setting">
								Group unread notes by repo
							</label>
							<p className="config-row__hint">
								Each repo gets a header with a button to mark all of its unread
								notes as read
							</p>
						</div>
						<input
							type="checkbox"
							id="group-by-repo-setting"
							checked={isGroupByRepoEnabled}
							onChange={toggleGroupByRepo}
						/>
					</li>
					<li className="config-row config-row--toggle">
						<div>
							<label htmlFor="low-priority-setting">
								De-prioritize minor updates
							</label>
							<p className="config-row__hint">
								New activity soon after marking a note read without opening it
								is shown lower in the list, unless it is a new mention
							</p>
						</div>
						<input
							type="checkbox"
							id="low-priority-setting"
							checked={isLowPriorityEnabled}
							onChange={toggleLowPriority}
						/>
					</li>
					<li className="config-row config-row--toggle">
						<div>
							<label htmlFor="low-priority-window-setting">
								Minor update window
							</label>
							<p className="config-row__hint">
								How long after marking a note read that new activity counts as
								minor
							</p>
						</div>
						<select
							id="low-priority-window-setting"
							value={lowPriorityWindowHours}
							disabled={!isLowPriorityEnabled}
							onChange={changeLowPriorityWindow}
						>
							{windowHoursChoices.map((hours) => (
								<option key={hours} value={hours}>
									{formatWindowHours(hours)}
								</option>
							))}
						</select>
					</li>
					<li className="config-row config-row--nav">
						<button
							className="edit-low-priority-titles-button"
							onClick={showLowPriorityTitles}
						>
							Low priority titles
						</button>
					</li>
					<li className="config-row config-row--nav">
						<button
							className="edit-muted-repos-button"
							onClick={showMutedReposList}
						>
							Muted repos
						</button>
					</li>
					<li className="config-row config-row--toggle">
						<div>
							<label htmlFor="reset-tips-button">Reset tips</label>
							<p className="config-row__hint">
								Show dismissed tips about these settings again
							</p>
						</div>
						<button
							id="reset-tips-button"
							className="btn--cancel reset-tips-button"
							disabled={!hasDismissedTips}
							onClick={() => dispatch(resetFeatureTips())}
						>
							Reset
						</button>
					</li>
				</ul>
			</div>
		</div>
	);
}
