import React from 'react';
import ConfigPage from '../components/config-page';
import UncheckedNotice from '../components/unchecked-notice';
import AddTokenForm from '../components/add-token-form';
import NotificationsArea from '../components/notifications-area';
import MutedReposList from '../components/muted-repos-list';
import {
	PANE_CONFIG,
	PANE_TOKEN,
	PANE_MUTED_REPOS,
	PANE_ACCOUNTS,
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
} from '../types';
import { AppPane } from '../types';
import AccountList from './account-list';
import { setAccounts } from '../lib/reducer';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';

export default function MainPane({
	token,
	isTokenInvalid,
	currentPane,
	openUrl,
	changeToken,
	quitApp,
	hideEditToken,
	showEditToken,
	showAccounts,
	showMutedReposList,
	lastSuccessfulCheck,
	getVersion,
	newNotes,
	readNotes,
	markRead,
	markUnread,
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
}: {
	token: string;
	currentPane: AppPane;
	openUrl: OpenUrl;
	changeToken: (token: string) => void;
	quitApp: () => void;
	hideEditToken: () => void;
	showEditToken: () => void;
	showAccounts: () => void;
	showMutedReposList: () => void;
	lastSuccessfulCheck: AppReduxState['lastSuccessfulCheck'];
	getVersion: () => Promise<string>;
	newNotes: Note[];
	readNotes: Note[];
	markRead: MarkRead;
	markUnread: MarkUnread;
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
}) {
	const accounts = useSelector((state: AppReduxState) => state.accounts);
	const dispatch = useDispatch();
	if (!token || isTokenInvalid || currentPane === PANE_TOKEN) {
		return (
			<AddTokenForm
				token={token}
				openUrl={openUrl}
				changeToken={changeToken}
				hideEditToken={hideEditToken}
				showCancel={currentPane === PANE_TOKEN}
				isTokenInvalid={isTokenInvalid}
			/>
		);
	}
	if (currentPane === PANE_MUTED_REPOS) {
		return <MutedReposList mutedRepos={mutedRepos} unmuteRepo={unmuteRepo} />;
	}
	if (currentPane === PANE_ACCOUNTS) {
		return (
			<AccountList
				goBack={hideEditToken}
				accounts={accounts}
				setAccounts={(newAccounts) => dispatch(setAccounts(newAccounts))}
			/>
		);
	}
	if (currentPane === PANE_CONFIG) {
		return (
			<ConfigPage
				openUrl={openUrl}
				showAccounts={showAccounts}
				showMutedReposList={showMutedReposList}
				getVersion={getVersion}
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
			muteRepo={muteRepo}
			unmuteRepo={unmuteRepo}
			mutedRepos={mutedRepos}
			openUrl={openUrl}
			token={token}
			searchValue={searchValue}
			filterType={filterType}
			appVisible={appVisible}
		/>
	);
}
