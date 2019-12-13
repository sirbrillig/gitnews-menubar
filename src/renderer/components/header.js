import React from 'react';
import Gridicon from 'gridicons';
import Logo from '../components/logo';
import LastChecked from '../components/last-checked';
import OfflineNotice from '../components/offline-notice';
import FetchingInProgress from '../components/fetching-in-progress';
import createUpdater from '../components/updater';
import Vanisher from '../components/vanisher';

const UpdatingLastChecked = createUpdater(LastChecked);
const UpdatingOfflineNotice = createUpdater(OfflineNotice);

function LeftButton({ hideConfig, showConfig }) {
	if (hideConfig) {
		return (
			<a className="back-button" href="#" onClick={hideConfig} title="Back">
				<Gridicon icon="chevron-left" />
			</a>
		);
	}
	if (showConfig) {
		return (
			<a
				href="#"
				className="config-button"
				onClick={showConfig}
				titke="Configuration">
				<Gridicon icon="cog" />
			</a>
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
			<div className="header__secondary">
				{lastSuccessfulCheck && (
					<UpdatingLastChecked lastSuccessfulCheck={lastSuccessfulCheck} />
				)}
			</div>
			<Vanisher isVisible={offline}>
				<UpdatingOfflineNotice
					fetchNotifications={fetchNotifications}
					lastChecked={lastChecked}
					fetchInterval={fetchInterval}
				/>
			</Vanisher>
			<Vanisher isVisible={fetchingInProgress}>
				<FetchingInProgress />
			</Vanisher>
		</header>
	);
}
