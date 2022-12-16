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
} from 'common/lib/constants';

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
	checkForUpdates,
	fetchingInProgress,
	isAutoLoadEnabled,
	changeAutoLoad,
	muteRepo,
	unmuteRepo,
	mutedRepos,
	searchValue,
	filterType,
	appVisible,
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
				checkForUpdates={checkForUpdates}
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
