import React from 'react';
import ConfigPage from '../components/config-page';
import UncheckedNotice from '../components/unchecked-notice';
import AddTokenForm from '../components/add-token-form';
import NotificationsArea from '../components/notifications-area';
import { PANE_CONFIG, PANE_TOKEN } from 'common/lib/constants';

export default function MainPane({
	token,
	currentPane,
	openUrl,
	changeToken,
	quitApp,
	hideEditToken,
	showEditToken,
	lastSuccessfulCheck,
	version,
	newNotes,
	readNotes,
	markRead,
	markUnread,
	checkForUpdates,
	fetchingInProgress,
	isAutoLoadEnabled,
	changeAutoLoad,
	muteRepo,
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
	if (currentPane === PANE_CONFIG) {
		return (
			<ConfigPage
				openUrl={openUrl}
				showEditToken={showEditToken}
				version={version}
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
			openUrl={openUrl}
			token={token}
		/>
	);
}
