import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setLowPriorityEnabled, setGroupByRepoEnabled } from '../lib/reducer';
import { AppReduxState } from '../types';

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
	const isGroupByRepoEnabled = useSelector(
		(state: AppReduxState) => state.isGroupByRepoEnabled
	);
	const toggleGroupByRepo = (event: { target: { checked: boolean } }) =>
		dispatch(setGroupByRepoEnabled(event.target.checked));

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
								New activity within 48 hours of marking a note read without
								opening it is shown lower in the list, unless it is a new
								mention
							</p>
						</div>
						<input
							type="checkbox"
							id="low-priority-setting"
							checked={isLowPriorityEnabled}
							onChange={toggleLowPriority}
						/>
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
				</ul>
			</div>
		</div>
	);
}
