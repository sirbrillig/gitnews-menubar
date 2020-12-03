import PropTypes from 'prop-types';
import { ipcRenderer } from 'electron';
import React from 'react';
import { connect } from 'react-redux';
import {
	markAllNotesSeen,
	scrollToTop,
	markAppHidden,
	markAppShown,
} from 'common/lib/reducer';

class AppWrapper extends React.Component {
	constructor(props) {
		super(props);
		ipcRenderer.on('hide-app', () => {
			this.props.markAppHidden();
		});
		ipcRenderer.on('show-app', () => {
			this.props.markAppShown();
		});
		ipcRenderer.on('menubar-click', () => {
			this.props.markAllNotesSeen();
			this.props.scrollToTop();
		});
	}

	render() {
		return this.props.children;
	}
}

AppWrapper.propTypes = {
	// Functions
	quitApp: PropTypes.func.isRequired,
	// All following are provided by connect
	markAllNotesSeen: PropTypes.func.isRequired,
	scrollToTop: PropTypes.func.isRequired,

	// Values
	version: PropTypes.string.isRequired,
};

const actions = {
	markAllNotesSeen,
	scrollToTop,
	markAppHidden,
	markAppShown,
};

export default connect(null, actions)(AppWrapper);
