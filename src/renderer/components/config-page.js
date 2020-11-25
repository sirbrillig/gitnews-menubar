import React from 'react';
import Copyright from '../components/copyright';
import Attributions from '../components/attributions';

export default function ConfigPage({
	showEditToken,
	openUrl,
	version,
	quitApp,
	checkForUpdates,
	isAutoLoadEnabled,
	changeAutoLoad,
}) {
	const toggleAutoLoad = event => changeAutoLoad(event.target.checked);

	return (
		<div className="config-page">
			<h2 className="config-page__title">Configuration</h2>
			<h3>Token</h3>
			<div>
				<div>Would you like to change your authentication token?</div>
				<button className="edit-token-button" onClick={showEditToken}>
					Edit token
				</button>
			</div>
			<h3>Settings</h3>
			<div>
				<input
					type="checkbox"
					id="auto-load-setting"
					className="auto-load-setting"
					checked={isAutoLoadEnabled}
					onChange={toggleAutoLoad}
				/>
				<label htmlFor="auto-load-setting" className="auto-load-setting-label">
					Launch Gitnews at login
				</label>
			</div>
			<Attributions openUrl={openUrl} />
			<div className="config-page__buttons">
				<button className="btn--cancel quit-button" onClick={quitApp}>
					Quit
				</button>
				<button
					className="btn check-for-updates-button"
					onClick={checkForUpdates}
				>
					Check for Updates
				</button>
			</div>
			<Copyright openUrl={openUrl} version={version} />
		</div>
	);
}
