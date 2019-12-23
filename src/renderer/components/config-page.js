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
			<div>Would you like to change your authentication token?</div>
			<a href="#" onClick={showEditToken}>
				Edit token
			</a>
			<h3>Settings</h3>
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
			<Attributions openUrl={openUrl} />
			<div className="config-page__buttons">
				<a className="btn quit-button" onClick={quitApp} href="#" title="Quit">
					Quit
				</a>
				<a
					className="btn"
					onClick={checkForUpdates}
					href="#"
					title="Check for Updates">
					Check for Updates
				</a>
			</div>
			<Copyright openUrl={openUrl} version={version} />
		</div>
	);
}
