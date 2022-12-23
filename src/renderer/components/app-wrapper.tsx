import React from 'react';
import { connect } from 'react-redux';
import {
	markAllNotesSeen,
	scrollToTop,
	markAppHidden,
	markAppShown,
} from '../lib/reducer';

interface AppWrapperProps {
	quitApp: () => void;
	markAllNotesSeen: () => void;
	scrollToTop: () => void;
	markAppHidden: () => void;
	markAppShown: () => void;
	children: React.ReactNode;
}

class AppWrapper extends React.Component<AppWrapperProps> {
	constructor(props: AppWrapperProps) {
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

const actions = {
	markAllNotesSeen,
	scrollToTop,
	markAppHidden,
	markAppShown,
};

export default connect(null, actions)(AppWrapper);
