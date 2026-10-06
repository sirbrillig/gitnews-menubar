import React from 'react';
import ConfigPage from '../components/config-page';
import UncheckedNotice from '../components/unchecked-notice';
import NotificationsArea from '../components/notifications-area';
import MutedReposList from '../components/muted-repos-list';
import LowPriorityTitlesList from '../components/low-priority-titles-list';
import ListSettingsPage from '../components/list-settings-page';
import AboutPage from '../components/about-page';
import {
	PANE_CONFIG,
	PANE_MUTED_REPOS,
	PANE_LOW_PRIORITY_TITLES,
	PANE_LIST_SETTINGS,
	PANE_ABOUT,
	PANE_ACCOUNTS,
	PANE_ACCOUNT_EDIT,
	defaultAccountInfo,
} from '../lib/constants';
import {
	AppReduxState,
	ChangeAutoload,
	FilterType,
	MarkRead,
	MarkUnread,
	MuteRepo,
	Note,
	OpenUrl,
	UnmuteRepo,
	UnsubscribeNote,
} from '../types';
import { AppPane } from '../types';
import AccountList from './account-list';
import { useSelector } from 'react-redux';
import AccountEdit from './account-edit';
import { useDispatch } from 'react-redux';
import { setAccounts } from '../lib/reducer';

export default function MainPane({
	token,
	isTokenInvalid,
	currentPane,
	openUrl,
	quitApp,
	showAccounts,
	showAccountEdit,
	showMutedReposList,
	showLowPriorityTitles,
	showListSettings,
	showAbout,
	lastSuccessfulCheck,
	getVersion,
	newNotes,
	readNotes,
	markRead,
	markUnread,
	unsubscribeNote,
	fetchingInProgress,
	isAutoLoadEnabled,
	changeAutoLoad,
	muteRepo,
	unmuteRepo,
	mutedRepos,
	searchValue,
	filterType,
	appVisible,
	isLogging,
	toggleLogging,
	isMultiOpenMode,
	setMultiOpenMode,
}: {
	token: string;
	currentPane: AppPane;
	openUrl: OpenUrl;
	quitApp: () => void;
	showAccounts: () => void;
	showAccountEdit: () => void;
	showMutedReposList: () => void;
	showLowPriorityTitles: () => void;
	showListSettings: () => void;
	showAbout: () => void;
	lastSuccessfulCheck: AppReduxState['lastSuccessfulCheck'];
	getVersion: () => Promise<string>;
	newNotes: Note[];
	readNotes: Note[];
	markRead: MarkRead;
	markUnread: MarkUnread;
	unsubscribeNote: UnsubscribeNote;
	fetchingInProgress: AppReduxState['fetchingInProgress'];
	isAutoLoadEnabled: boolean;
	changeAutoLoad: ChangeAutoload;
	muteRepo: MuteRepo;
	unmuteRepo: UnmuteRepo;
	mutedRepos: string[];
	searchValue: string;
	filterType: FilterType;
	appVisible: boolean;
	isLogging: boolean;
	toggleLogging: (newValue: boolean) => void;
	isTokenInvalid: boolean;
	isMultiOpenMode: boolean;
	setMultiOpenMode: (isActive: boolean) => void;
}) {
	const accounts = useSelector((state: AppReduxState) => state.accounts);
	const dispatch = useDispatch();
	const selectedAccount = useSelector(
		(state: AppReduxState) => state.selectedAccount
	);

	if (accounts.length === 0 && token) {
		// Migrate old single-token system to account.
		const migratedAccount = {
			...defaultAccountInfo,
			apiKey: token,
		};
		dispatch(setAccounts([migratedAccount]));
		return (
			<div>
				<div>Migrating to account system…</div>
				<div>If you see this for more than a moment, something is wrong.</div>
			</div>
		);
	}

	if (accounts.length === 0) {
		return (
			<AccountEdit account={defaultAccountInfo} showAccounts={showAccounts} />
		);
	}
	if (currentPane === PANE_MUTED_REPOS) {
		return <MutedReposList mutedRepos={mutedRepos} unmuteRepo={unmuteRepo} />;
	}
	if (currentPane === PANE_LOW_PRIORITY_TITLES) {
		return <LowPriorityTitlesList />;
	}
	if (currentPane === PANE_LIST_SETTINGS) {
		return (
			<ListSettingsPage
				showMutedReposList={showMutedReposList}
				showLowPriorityTitles={showLowPriorityTitles}
			/>
		);
	}
	if (currentPane === PANE_ABOUT) {
		return <AboutPage openUrl={openUrl} getVersion={getVersion} />;
	}
	if (currentPane === PANE_ACCOUNT_EDIT && selectedAccount) {
		return (
			<AccountEdit account={selectedAccount} showAccounts={showAccounts} />
		);
	}
	if (currentPane === PANE_ACCOUNTS || isTokenInvalid) {
		return (
			<AccountList accounts={accounts} showAccountEdit={showAccountEdit} />
		);
	}
	if (currentPane === PANE_CONFIG) {
		return (
			<ConfigPage
				showAccounts={showAccounts}
				showListSettings={showListSettings}
				showAbout={showAbout}
				quitApp={quitApp}
				isAutoLoadEnabled={isAutoLoadEnabled}
				changeAutoLoad={changeAutoLoad}
				isLogging={isLogging}
				toggleLogging={toggleLogging}
			/>
		);
	}
	if (!lastSuccessfulCheck) {
		return (
			<UncheckedNotice
				fetchingInProgress={fetchingInProgress}
				openUrl={openUrl}
			/>
		);
	}
	return (
		<NotificationsArea
			newNotes={newNotes}
			readNotes={readNotes}
			markRead={markRead}
			markUnread={markUnread}
			unsubscribeNote={unsubscribeNote}
			muteRepo={muteRepo}
			unmuteRepo={unmuteRepo}
			mutedRepos={mutedRepos}
			openUrl={openUrl}
			token={token}
			searchValue={searchValue}
			filterType={filterType}
			appVisible={appVisible}
			isMultiOpenMode={isMultiOpenMode}
			setMultiOpenMode={setMultiOpenMode}
		/>
	);
}
