const React = require( 'react' );
const el = React.createElement;
const CSSTransitionGroup = require( 'react-transition-group/CSSTransitionGroup' );
const ConfigPage = require( '../components/config-page' );
const UncheckedNotice = require( '../components/unchecked-notice' );
const AddTokenForm = require( '../components/add-token-form' );
const NotificationsArea = require( '../components/notifications-area' );
const { PANE_CONFIG, PANE_TOKEN } = require( '../lib/constants' );

function MainPane( {
	token,
	currentPane,
	openUrl,
	writeToken,
	quitApp,
	hideEditToken,
	showEditToken,
	lastSuccessfulCheck,
	version,
	newNotes,
	readNotes,
	markRead,
} ) {
	const getPane = function() {
		if ( ! token || currentPane === PANE_TOKEN ) {
			return el( AddTokenForm, { key: 'AddTokenForm', token, openUrl, writeToken, hideEditToken, showCancel: currentPane === PANE_TOKEN } );
		}
		if ( currentPane === PANE_CONFIG ) {
			return el( ConfigPage, { key: 'ConfigPage', openUrl, showEditToken, version, quitApp } );
		}
		if ( ! lastSuccessfulCheck ) {
			return el( UncheckedNotice, { key: 'UncheckedNotice' } );
		}
		return el( NotificationsArea, { key: 'NotificationsArea', newNotes, readNotes, markRead, openUrl } );
	};

	return el( 'div', { className: 'main-pane' },
			el( CSSTransitionGroup, {
				transitionName: 'note',
				transitionAppear: false,
				transitionEnter: true,
				transitionLeave: false,
				transitionAppearTimeout: 800,
				transitionEnterTimeout: 800,
				transitionLeaveTimeout: 800,
			},
				getPane()
			)
	);
}

module.exports = MainPane;
