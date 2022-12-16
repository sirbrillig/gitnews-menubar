import PropTypes from 'prop-types';
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
		window.electronApi.onHide(() => {
			this.props.markAppHidden();
		});
		window.electronApi.onShow(() => {
			this.props.markAppShown();
		});
		window.electronApi.onClick(() => {
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
};

const actions = {
	markAllNotesSeen,
	scrollToTop,
	markAppHidden,
	markAppShown,
};

export default connect(null, actions)(AppWrapper);
