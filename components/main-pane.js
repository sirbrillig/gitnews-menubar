const React = require( 'react' );
const el = React.createElement;
const ConfigPage = require( '../components/config-page' );
const UncheckedNotice = require( '../components/unchecked-notice' );
const AddTokenForm = require( '../components/add-token-form' );
const NotificationsArea = require( '../components/notifications-area' );
const { PANE_CONFIG, PANE_TOKEN } = require( '../lib/constants' );

function MainPane( {
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
	checkForUpdates,
	fetchingInProgress,
	isAutoLoadEnabled,
	changeAutoLoad,
} ) {
	if ( ! token || currentPane === PANE_TOKEN ) {
		return el( AddTokenForm, { token, openUrl, changeToken, hideEditToken, showCancel: currentPane === PANE_TOKEN } );
	}
	if ( currentPane === PANE_CONFIG ) {
		return el( ConfigPage, { openUrl, showEditToken, version, quitApp, checkForUpdates, isAutoLoadEnabled, changeAutoLoad } );
	}
	if ( ! lastSuccessfulCheck ) {
		return el( UncheckedNotice, { fetchingInProgress, openUrl } );
	}
	return el( NotificationsArea, { newNotes, readNotes, markRead, openUrl } );
}

module.exports = MainPane;
