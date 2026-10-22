import React from 'react';
import { ChangeAutoload } from '../types';

export default function ConfigPage({
	showAccounts,
	showListSettings,
	showAbout,
	quitApp,
	isAutoLoadEnabled,
	changeAutoLoad,
	isLogging,
	toggleLogging,
}: {
	showAccounts: () => void;
	showListSettings: () => void;
	showAbout: () => void;
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
	const [isBetaUpdatesEnabled, toggleBetaUpdates] = useBetaUpdatesSetting();

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
						<button className="list-settings-button" onClick={showListSettings}>
							Notification list
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
					<li className="config-row config-row--toggle">
						<div>
							<label htmlFor="beta-updates-setting">Include beta updates</label>
							<p className="config-row__hint">
								Offer prerelease versions when checking for updates
							</p>
						</div>
						<input
							type="checkbox"
							id="beta-updates-setting"
							checked={isBetaUpdatesEnabled}
							onChange={(event) => toggleBetaUpdates(event.target.checked)}
						/>
					</li>
					<li className="config-row config-row--nav">
						<button className="about-button" onClick={showAbout}>
							About
						</button>
					</li>
				</ul>
			</div>
			<div className="config-page__buttons">
				<button className="btn--cancel quit-button" onClick={quitApp}>
					Quit
				</button>
			</div>
		</div>
	);
}

function useBetaUpdatesSetting(): [boolean, (isEnabled: boolean) => void] {
	const [isEnabled, setIsEnabled] = React.useState(false);
	React.useEffect(() => {
		window.electronApi.isBetaUpdatesEnabled().then(setIsEnabled);
	}, []);
	const toggle = React.useCallback((newValue: boolean) => {
		setIsEnabled(newValue);
		window.electronApi.setBetaUpdatesEnabled(newValue);
	}, []);
	return [isEnabled, toggle];
}
