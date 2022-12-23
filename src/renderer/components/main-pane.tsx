import React from 'react';
import ConfigPage from '../components/config-page';
import UncheckedNotice from '../components/unchecked-notice';
import AddTokenForm from '../components/add-token-form';
import NotificationsArea from '../components/notifications-area';
import MutedReposList from '../components/muted-repos-list';
import { PANE_CONFIG, PANE_TOKEN, PANE_MUTED_REPOS } from '../lib/constants';
import {
	AppReduxState,
	ChangeAutoload,
	MarkRead,
	MarkUnread,
	MuteRepo,
	Note,
	OpenUrl,
	UnmuteRepo,
} from '../types';
import { AppPane } from '../types';

export default function MainPane({
	token,
	currentPane,
	openUrl,
	changeToken,
	quitApp,
	hideEditToken,
	showEditToken,
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
}: {
	token: string;
	currentPane: AppPane;
	openUrl: OpenUrl;
	changeToken: (token: string) => void;
	quitApp: () => void;
	hideEditToken: () => void;
	showEditToken: () => void;
	showMutedReposList: () => void;
	lastSuccessfulCheck: Pick<AppReduxState, 'lastSuccessfulCheck'>;
	getVersion: () => Promise<string>;
	newNotes: Note[];
	readNotes: Note[];
	markRead: MarkRead;
	markUnread: MarkUnread;
	fetchingInProgress: Pick<AppReduxState, 'fetchingInProgress'>;
	isAutoLoadEnabled: boolean;
	changeAutoLoad: ChangeAutoload;
	muteRepo: MuteRepo;
	unmuteRepo: UnmuteRepo;
	mutedRepos: string[];
	searchValue: string;
	filterType: string;
	appVisible: boolean;
}) {
	if (!token || currentPane === PANE_TOKEN) {
		return (
			<AddTokenForm
				token={token}
				openUrl={openUrl}
				changeToken={changeToken}
				hideEditToken={hideEditToken}
				showCancel={currentPane === PANE_TOKEN}
			/>
		);
	}
	if (currentPane === PANE_MUTED_REPOS) {
		return <MutedReposList mutedRepos={mutedRepos} unmuteRepo={unmuteRepo} />;
	}
	if (currentPane === PANE_CONFIG) {
		return (
			<ConfigPage
				openUrl={openUrl}
				showEditToken={showEditToken}
				showMutedReposList={showMutedReposList}
				getVersion={getVersion}
				quitApp={quitApp}
				isAutoLoadEnabled={isAutoLoadEnabled}
				changeAutoLoad={changeAutoLoad}
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
