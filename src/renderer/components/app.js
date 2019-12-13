import AutoLaunch from 'auto-launch';
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import debugFactory from 'debug';
import Header from '../components/header';
import ErrorsArea from '../components/errors-area';
import MainPane from '../components/main-pane';
import { PANE_CONFIG, PANE_NOTIFICATIONS } from 'common/lib/constants';
import Poller from 'common/lib/poller';
import { getSecondsUntilNextFetch } from 'common/lib/helpers';
import {
	hideEditToken,
	showEditToken,
	hideConfig,
	showConfig,
	markRead,
	markUnread,
	clearErrors,
	fetchNotifications,
	openUrl,
	checkForUpdates,
	setIcon,
	changeToken,
	changeAutoLoad,
} from 'common/lib/reducer';

const debug = debugFactory('gitnews-menubar');

class App extends React.Component {
	constructor(props) {
		super(props);
		const shouldComponentPoll = () =>
			getSecondsUntilNextFetch(
				this.props.lastChecked,
				this.props.fetchInterval
			) < 1;
		const pollFunction = () => {
			shouldComponentPoll() && this.props.fetchNotifications();
			return true;
		};
		this.fetcher = new Poller({ pollFunction });
	}

	componentDidMount() {
		debug('App mounted');
		this.fetcher.begin();
		const autoLauncher = new AutoLaunch({ name: 'Gitnews' });
		autoLauncher
			.isEnabled()
			.then(isEnabled => {
				this.props.changeAutoLoad(isEnabled);
			})
			.catch(function(err) {
				console.error('failed to fetch autoload', err); // eslint-disable-line no-console
				// TODO: maybe send to sentry?
			});
	}

	componentWillUnmount() {
		this.fetcher.end();
	}

	getReadNotifications() {
		return this.props.notes.filter(
			note => !note.unread && !note.gitnewsMarkedUnread
		);
	}

	getUnreadNotifications() {
		return this.props.notes.filter(
			note => note.unread || note.gitnewsMarkedUnread
		);
	}

	getUnseenNotifications() {
		return this.getUnreadNotifications().filter(note => !note.gitnewsSeen);
	}

	getNextIcon({ offline, errors, unseenNotes, unreadNotes }) {
		if (offline) {
			return 'offline';
		}
		if (errors.length) {
			return 'error';
		}
		if (unseenNotes.length) {
			return 'unseen';
		}
		if (unreadNotes.length) {
			return 'unread';
		}
		return 'normal';
	}

	render() {
		const {
			offline,
			errors,
			currentPane,
			token,
			lastSuccessfulCheck,
			version,
			fetchingInProgress,
		} = this.props;
		const newNotes = this.getUnreadNotifications();
		const readNotes = this.getReadNotifications();
		const unseenNotes = this.getUnseenNotifications();
		const nextIcon = this.getNextIcon({
			offline,
			errors,
			unseenNotes,
			unreadNotes: newNotes,
		});

		debug('sending set-icon', nextIcon);
		this.props.setIcon(nextIcon);

		return (
			<main>
				<Header
					{...{
						offline,
						fetchNotifications: this.props.fetchNotifications,
						lastSuccessfulCheck,
						lastChecked: this.props.lastChecked,
						fetchInterval: this.props.fetchInterval,
						showConfig:
							token &&
							currentPane === PANE_NOTIFICATIONS &&
							this.props.showConfig,
						hideConfig:
							token && currentPane === PANE_CONFIG && this.props.hideConfig,
						openUrl: this.props.openUrl,
						fetchingInProgress,
					}}
				/>
				<ErrorsArea errors={errors} clearErrors={this.props.clearErrors} />
				<MainPane
					{...{
						token,
						currentPane,
						version,
						newNotes,
						readNotes,
						lastSuccessfulCheck,
						fetchingInProgress,
						openUrl: this.props.openUrl,
						changeToken: this.props.changeToken,
						quitApp: this.props.quitApp,
						hideEditToken: this.props.hideEditToken,
						showEditToken: this.props.showEditToken,
						markRead: this.props.markRead,
						markUnread: this.props.markUnread,
						checkForUpdates: this.props.checkForUpdates,
						isAutoLoadEnabled: this.props.isAutoLoadEnabled,
						changeAutoLoad: this.props.changeAutoLoad,
					}}
				/>
			</main>
		);
	}
}

App.propTypes = {
	// Actions
	quitApp: PropTypes.func.isRequired,
	// All following are provided by connect
	changeToken: PropTypes.func.isRequired,
	setIcon: PropTypes.func.isRequired,
	checkForUpdates: PropTypes.func.isRequired,
	openUrl: PropTypes.func.isRequired,
	fetchNotifications: PropTypes.func.isRequired,
	markRead: PropTypes.func.isRequired,
	markUnread: PropTypes.func.isRequired,
	clearErrors: PropTypes.func.isRequired,
	showEditToken: PropTypes.func.isRequired,
	hideEditToken: PropTypes.func.isRequired,
	hideConfig: PropTypes.func.isRequired,
	showConfig: PropTypes.func.isRequired,
	changeAutoLoad: PropTypes.func.isRequired,

	// Values
	version: PropTypes.string.isRequired,
	// All following are provided by connect
	notes: PropTypes.array.isRequired,
	offline: PropTypes.bool,
	errors: PropTypes.array,
	currentPane: PropTypes.string.isRequired,
	token: PropTypes.string,
	lastSuccessfulCheck: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
	fetchingInProgress: PropTypes.bool,
	lastChecked: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
	fetchInterval: PropTypes.number,
	isAutoLoadEnabled: PropTypes.bool,
};

function mapStateToProps(state) {
	return {
		notes: state.notes,
		offline: state.offline,
		errors: state.errors,
		currentPane: state.currentPane,
		token: state.token,
		lastSuccessfulCheck: state.lastSuccessfulCheck,
		fetchingInProgress: state.fetchingInProgress,
		lastChecked: state.lastChecked,
		fetchInterval: state.fetchInterval,
		isAutoLoadEnabled: state.isAutoLoadEnabled,
	};
}

const actions = {
	hideEditToken,
	showEditToken,
	hideConfig,
	showConfig,
	markRead,
	markUnread,
	clearErrors,
	fetchNotifications,
	openUrl,
	checkForUpdates,
	setIcon,
	changeToken,
	changeAutoLoad,
};

module.exports = connect(mapStateToProps, actions)(App);
