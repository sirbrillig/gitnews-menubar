import React from 'react';
import Copyright from '../components/copyright';
import Attributions from '../components/attributions';

export default function ConfigPage({
	showEditToken,
	showMutedReposList,
	openUrl,
	getVersion,
	quitApp,
	isAutoLoadEnabled,
	changeAutoLoad,
}) {
	const toggleAutoLoad = event => changeAutoLoad(event.target.checked);

	return (
		<div className="config-page">
			<h2 className="config-page__title">Configuration</h2>
			<h3>Settings</h3>
			<ul className="config-page__settings">
				<li>
					<button className="edit-token-button" onClick={showEditToken}>
						Edit authentication token
					</button>
				</li>
				<li>
					<button
						className="edit-muted-repos-button"
						onClick={showMutedReposList}
					>
						Edit muted repos
					</button>
				</li>
				<li>
					<input
						type="checkbox"
						id="auto-load-setting"
						className="auto-load-setting"
						checked={isAutoLoadEnabled}
						onChange={toggleAutoLoad}
					/>
					<label
						htmlFor="auto-load-setting"
						className="auto-load-setting-label"
					>
						Launch Gitnews at login
					</label>
				</li>
			</ul>
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
