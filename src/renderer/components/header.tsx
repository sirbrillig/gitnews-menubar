import React from 'react';
import Gridicon from 'gridicons';
import Logo from '../components/logo';
import LastChecked from '../components/last-checked';
import OfflineNotice from '../components/offline-notice';
import FetchingInProgress from '../components/fetching-in-progress';
import createUpdater from '../components/updater';
import FilterButton from './filter-button';
import { PANE_NOTIFICATIONS } from '../lib/constants';
import { AppPane, FilterType } from '../types';

const UpdatingLastChecked = createUpdater(LastChecked);
const UpdatingOfflineNotice = createUpdater(OfflineNotice);

function LeftButton({
	hideConfig,
	showConfig,
}: {
	hideConfig: () => void;
	showConfig: () => void;
}) {
	if (hideConfig) {
		return (
			<button
				className="back-button left-button"
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
				className="config-button left-button"
				onClick={showConfig}
				aria-label="Open settings"
			>
				<Gridicon icon="cog" />
			</button>
		);
	}
	return <span className="config-spacer left-button" />;
}

export default function Header({
	lastSuccessfulCheck,
	lastChecked,
	fetchInterval,
	showConfig,
	offline,
	fetchNotifications,
	hideConfig,
	fetchingInProgress,
	children,
	filterType,
	setFilterType,
	currentPane,
}: {
	lastSuccessfulCheck: number | false;
	lastChecked: number | false;
	fetchInterval: number;
	showConfig: () => void;
	offline: boolean;
	fetchNotifications: () => void;
	hideConfig: () => void;
	fetchingInProgress: boolean;
	children: React.ReactNode;
	filterType: FilterType;
	setFilterType: (type: string) => void;
	currentPane: AppPane;
}) {
	return (
		<header>
			<div className="header__primary">
				<LeftButton hideConfig={hideConfig} showConfig={showConfig} />
				<Logo />
				{currentPane === PANE_NOTIFICATIONS ? (
					<FilterButton filterType={filterType} setFilterType={setFilterType} />
				) : (
					<div className="config-spacer" />
				)}
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
			{children}
		</header>
	);
}

function SecondaryHeader({
	lastSuccessfulCheck,
	fetchingInProgress,
}: {
	lastSuccessfulCheck: false | number;
	fetchingInProgress: boolean;
}) {
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
