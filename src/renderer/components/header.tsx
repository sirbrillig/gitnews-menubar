import React from 'react';
import Gridicon from 'gridicons';
import Logo from '../components/logo';
import LastChecked from '../components/last-checked';
import OfflineNotice from '../components/offline-notice';
import FetchingInProgress from '../components/fetching-in-progress';
import createUpdater from '../components/updater';
import FilterButton from './filter-button';
import { PANE_NOTIFICATIONS } from '../lib/constants';
import { AppPane, AppReduxState, FilterType } from '../types';
import { useSelector } from 'react-redux';

const UpdatingLastChecked = createUpdater(LastChecked);
const UpdatingOfflineNotice = createUpdater(OfflineNotice);

function LeftButton({
	hideConfig,
	showConfig,
}: {
	hideConfig?: () => void;
	showConfig?: () => void;
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
	isTokenInvalid,
	fetchNotifications,
	hideConfig,
	fetchingInProgress,
	children,
	filterType,
	setFilterType,
	currentPane,
	showUnreadOnly,
	setShowUnreadOnly,
}: {
	lastSuccessfulCheck: number | false;
	lastChecked: number | false;
	fetchInterval: number;
	showConfig?: () => void;
	offline: boolean;
	isTokenInvalid: boolean;
	fetchNotifications: () => void;
	hideConfig?: () => void;
	fetchingInProgress: boolean;
	children: React.ReactNode;
	filterType: FilterType;
	setFilterType: (type: FilterType) => void;
	currentPane: AppPane;
	showUnreadOnly: boolean;
	setShowUnreadOnly: (value: boolean) => void;
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
				currentPane={currentPane}
				showUnreadOnly={showUnreadOnly}
				setShowUnreadOnly={setShowUnreadOnly}
			/>
			{isTokenInvalid && !fetchingInProgress && <InvalidTokenNotice />}
			{!isTokenInvalid && offline && (
				<UpdatingOfflineNotice
					fetchNotifications={fetchNotifications}
					lastChecked={lastChecked}
					fetchInterval={fetchInterval}
				/>
			)}
			{!isTokenInvalid && !offline && <FetchErrorNotice />}
			{children}
		</header>
	);
}

function SecondaryHeader({
	lastSuccessfulCheck,
	fetchingInProgress,
	currentPane,
	showUnreadOnly,
	setShowUnreadOnly,
}: {
	lastSuccessfulCheck: false | number;
	fetchingInProgress: boolean;
	currentPane: AppPane;
	showUnreadOnly: boolean;
	setShowUnreadOnly: (value: boolean) => void;
}) {
	if (fetchingInProgress) {
		return (
			<div className="header__secondary">
				<FetchingInProgress />
			</div>
		);
	}
	if (currentPane === PANE_NOTIFICATIONS) {
		return (
			<div className="header__secondary">
				<ReadStatusToggle
					showUnreadOnly={showUnreadOnly}
					setShowUnreadOnly={setShowUnreadOnly}
				/>
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

function ReadStatusToggle({
	showUnreadOnly,
	setShowUnreadOnly,
}: {
	showUnreadOnly: boolean;
	setShowUnreadOnly: (value: boolean) => void;
}) {
	return (
		<div className="read-status-toggle">
			<button
				className={`read-status-toggle__button${!showUnreadOnly ? ' read-status-toggle__button--active' : ''}`}
				onClick={() => setShowUnreadOnly(false)}
			>
				All
			</button>
			<button
				className={`read-status-toggle__button${showUnreadOnly ? ' read-status-toggle__button--active' : ''}`}
				onClick={() => setShowUnreadOnly(true)}
			>
				Unread
			</button>
		</div>
	);
}

function InvalidTokenNotice() {
	const accounts = useSelector((state: AppReduxState) => state.accounts);
	const accountNames = accounts
		.filter((account) => account.isInvalid)
		.map((account) => account.name)
		.join(', ');
	return (
		<div className="offline-notice">
			<span>
				Some of your accounts are not working: '{accountNames}'. Please
				double-check your info!
			</span>
		</div>
	);
}

function FetchErrorNotice() {
	const accounts = useSelector((state: AppReduxState) => state.accounts);
	const accountsWithFetchErrors = useSelector(
		(state: AppReduxState) => state.accountsWithFetchErrors
	);
	const failingAccounts = accounts.filter((account) =>
		accountsWithFetchErrors.includes(account.id)
	);
	if (failingAccounts.length === 0) {
		return null;
	}
	const accountNames = failingAccounts.map((account) => account.name).join(', ');
	return (
		<div className="offline-notice">
			<span>
				Could not fetch notifications for: '{accountNames}'. Check your
				connection or proxy settings.
			</span>
		</div>
	);
}
