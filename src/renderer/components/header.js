import React from 'react';
import Gridicon from 'gridicons';
import Logo from '../components/logo';
import LastChecked from '../components/last-checked';
import OfflineNotice from '../components/offline-notice';
import FetchingInProgress from '../components/fetching-in-progress';
import createUpdater from '../components/updater';

const UpdatingLastChecked = createUpdater(LastChecked);
const UpdatingOfflineNotice = createUpdater(OfflineNotice);

function LeftButton({ hideConfig, showConfig }) {
	if (hideConfig) {
		return (
			<button
				className="back-button"
				onClick={hideConfig}
				aria-label="Close settings"
			>
				<Gridicon icon="chevron-left" />
			</button>
		);
	}
	if (showConfig) {
		return (
			<button
				className="config-button"
				onClick={showConfig}
				aria-label="Open settings"
			>
				<Gridicon icon="cog" />
			</button>
		);
	}
	return <span className="config-spacer" />;
}

export default function Header({
	openUrl,
	lastSuccessfulCheck,
	lastChecked,
	fetchInterval,
	showConfig,
	offline,
	fetchNotifications,
	hideConfig,
	fetchingInProgress,
}) {
	const openLink = event => {
		event.preventDefault();
		openUrl(event.target.href);
	};
	return (
		<header>
			<div className="header__primary">
				<LeftButton hideConfig={hideConfig} showConfig={showConfig} />
				<Logo onClick={openLink} />
				<span className="config-spacer"></span>
			</div>
			<SecondaryHeader
				fetchingInProgress={fetchingInProgress}
				lastSuccessfulCheck={lastSuccessfulCheck}
			/>
			{offline && (
				<UpdatingOfflineNotice
					fetchNotifications={fetchNotifications}
					lastChecked={lastChecked}
					fetchInterval={fetchInterval}
				/>
			)}
		</header>
	);
}

function SecondaryHeader({ lastSuccessfulCheck, fetchingInProgress }) {
	if (fetchingInProgress) {
		return (
			<div className="header__secondary">
				<FetchingInProgress />
			</div>
		);
	}
	return (
		<div className="header__secondary">
			{lastSuccessfulCheck && (
				<UpdatingLastChecked lastSuccessfulCheck={lastSuccessfulCheck} />
			)}
		</div>
	);
}
