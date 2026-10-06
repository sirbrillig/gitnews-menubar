import React from 'react';
import Copyright from '../components/copyright';
import Attributions from '../components/attributions';
import { useDispatch, useSelector } from 'react-redux';
import { setLowPriorityEnabled } from '../lib/reducer';
import { AppReduxState, ChangeAutoload, OpenUrl } from '../types';

export default function ConfigPage({
	showAccounts,
	showMutedReposList,
	showLowPriorityTitles,
	openUrl,
	getVersion,
	quitApp,
	isAutoLoadEnabled,
	changeAutoLoad,
	isLogging,
	toggleLogging,
}: {
	showAccounts: () => void;
	showMutedReposList: () => void;
	showLowPriorityTitles: () => void;
	openUrl: OpenUrl;
	getVersion: () => Promise<string>;
	quitApp: () => void;
	isAutoLoadEnabled: boolean;
	changeAutoLoad: ChangeAutoload;
	isLogging: boolean;
	toggleLogging: (newSetting: boolean) => void;
}) {
	const toggleAutoLoad = (event: { target: { checked: boolean } }) =>
		changeAutoLoad(event.target.checked);
	const toggleIsLogging = (event: { target: { checked: boolean } }) =>
		toggleLogging(event.target.checked);
	const dispatch = useDispatch();
	const isLowPriorityEnabled = useSelector(
		(state: AppReduxState) => state.isLowPriorityEnabled
	);
	const toggleLowPriority = (event: { target: { checked: boolean } }) =>
		dispatch(setLowPriorityEnabled(event.target.checked));

	return (
		<div className="config-page">
			<div className="config-section">
				<div className="config-section__label">Settings</div>
				<ul className="config-page__settings">
					<li className="config-row config-row--nav">
						<button className="edit-token-button" onClick={showAccounts}>
							Accounts
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
					<li className="config-row config-row--nav">
						<button
							className="edit-low-priority-titles-button"
							onClick={showLowPriorityTitles}
						>
							Low priority titles
						</button>
					</li>
					<li className="config-row config-row--toggle">
						<label htmlFor="auto-load-setting">Launch at login</label>
						<input
							type="checkbox"
							id="auto-load-setting"
							checked={isAutoLoadEnabled}
							onChange={toggleAutoLoad}
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
					<li className="config-row config-row--toggle">
						<div>
							<label htmlFor="logging-setting">Enable error logging</label>
							<p className="config-row__hint">
								Logs are written to ~/Library/Logs/Gitnews/main.log
							</p>
						</div>
						<input
							type="checkbox"
							id="logging-setting"
							checked={isLogging}
							onChange={toggleIsLogging}
						/>
					</li>
				</ul>
			</div>
			<Attributions openUrl={openUrl} />
			<div className="config-page__buttons">
				<button className="btn--cancel quit-button" onClick={quitApp}>
					Quit
				</button>
			</div>
			<Copyright openUrl={openUrl} getVersion={getVersion} />
		</div>
	);
}
