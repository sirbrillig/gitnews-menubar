import AutoLaunch from 'auto-launch';
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import debugFactory from 'debug';
import Header from '../components/header';
import ErrorsArea from '../components/errors-area';
import MainPane from '../components/main-pane';
import {
	PANE_CONFIG,
	PANE_NOTIFICATIONS,
	PANE_TOKEN,
	PANE_MUTED_REPOS,
} from 'common/lib/constants';
import Poller from 'common/lib/poller';
import { getSecondsUntilNextFetch } from 'common/lib/helpers';
import {
	markRead,
	markUnread,
	clearErrors,
	fetchNotifications,
	openUrl,
	checkForUpdates,
	setIcon,
	changeToken,
	changeAutoLoad,
	muteRepo,
	unmuteRepo,
	setFilterType,
} from 'common/lib/reducer';
import SearchNotifications from './search-notifications';

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
		this.state = {
			currentPane: PANE_NOTIFICATIONS,
			searchValue: '',
		};
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
			});
	}

	componentWillUnmount() {
		this.fetcher.end();
	}

	getUnmutedNotifications() {
		return this.props.notes.filter(
			note => !this.props.mutedRepos.includes(note.repositoryFullName)
		);
	}

	getReadNotifications() {
		return this.props.notes.filter(note => {
			if (!note.unread && !note.gitnewsMarkedUnread) {
				return true;
			}
			// We have to include muted repo notifications somewhere, so we'll show
			// them with read notifications. That way they won't clutter new notes or
			// show any alert icons.
			if (this.props.mutedRepos.includes(note.repositoryFullName)) {
				return true;
			}
			return false;
		});
	}

	getUnreadNotifications() {
		return this.getUnmutedNotifications().filter(
			note => note.unread || note.gitnewsMarkedUnread
		);
	}

	getUnseenNotifications() {
		return this.getUnreadNotifications().filter(note => !note.gitnewsSeen);
	}

	getNextIcon({ offline, errors, unseenNotes, unreadNotes }) {
		if (errors.length) {
			return 'error';
		}
		if (unseenNotes.length) {
			return 'unseen';
		}
		if (unreadNotes.length) {
			return 'unread';
		}
		if (offline) {
			return 'offline';
		}
		return 'normal';
	}

	render() {
		const {
			offline,
			errors,
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

		const { currentPane } = this.state;
		const hideConfig = () => this.setState({ currentPane: PANE_NOTIFICATIONS });
		const showConfig = () => this.setState({ currentPane: PANE_CONFIG });
		const showEditToken = () => this.setState({ currentPane: PANE_TOKEN });
		const hideEditToken = () => this.setState({ currentPane: PANE_CONFIG });
		const showMutedReposList = () =>
			this.setState({ currentPane: PANE_MUTED_REPOS });
		const setSearchTo = value => this.setState({ searchValue: value });

		const showBackButton =
			token &&
			(currentPane === PANE_CONFIG || currentPane === PANE_MUTED_REPOS);
		const onBack = () => {
			if (currentPane === PANE_MUTED_REPOS) {
				showConfig();
				return;
			}
			hideConfig();
		};

		return (
			<main>
				<Header
					offline={offline}
					fetchNotifications={this.props.fetchNotifications}
					lastSuccessfulCheck={lastSuccessfulCheck}
					lastChecked={this.props.lastChecked}
					fetchInterval={this.props.fetchInterval}
					showConfig={token && currentPane === PANE_NOTIFICATIONS && showConfig}
					hideConfig={showBackButton ? onBack : null}
					fetchingInProgress={fetchingInProgress}
					filterType={this.props.filterType}
					setFilterType={this.props.setFilterType}
				>
					{currentPane === PANE_NOTIFICATIONS && (
						<SearchNotifications
							searchValue={this.state.searchValue}
							setSearchTo={setSearchTo}
						/>
					)}
				</Header>
				<ErrorsArea errors={errors} clearErrors={this.props.clearErrors} />
				<MainPane
					token={token}
					currentPane={currentPane}
					version={version}
					newNotes={newNotes}
					readNotes={readNotes}
					lastSuccessfulCheck={lastSuccessfulCheck}
					fetchingInProgress={fetchingInProgress}
					openUrl={this.props.openUrl}
					changeToken={this.props.changeToken}
					quitApp={this.props.quitApp}
					hideEditToken={hideEditToken}
					showEditToken={showEditToken}
					markRead={this.props.markRead}
					markUnread={this.props.markUnread}
					checkForUpdates={this.props.checkForUpdates}
					isAutoLoadEnabled={this.props.isAutoLoadEnabled}
					changeAutoLoad={this.props.changeAutoLoad}
					muteRepo={this.props.muteRepo}
					unmuteRepo={this.props.unmuteRepo}
					mutedRepos={this.props.mutedRepos}
					showMutedReposList={showMutedReposList}
					searchValue={this.state.searchValue}
					filterType={this.props.filterType}
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
	changeAutoLoad: PropTypes.func.isRequired,
	muteRepo: PropTypes.func.isRequired,
	unmuteRepo: PropTypes.func.isRequired,
	setFilterType: PropTypes.func.isRequired,

	// Values
	version: PropTypes.string.isRequired,
	// All following are provided by connect
	notes: PropTypes.array.isRequired,
	mutedRepos: PropTypes.arrayOf(PropTypes.string).isRequired,
	offline: PropTypes.bool,
	errors: PropTypes.array,
	token: PropTypes.string,
	lastSuccessfulCheck: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
	fetchingInProgress: PropTypes.bool,
	lastChecked: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
	fetchInterval: PropTypes.number,
	isAutoLoadEnabled: PropTypes.bool,
	filterType: PropTypes.string.isRequired,
};

function mapStateToProps(state) {
	return {
		notes: state.notes,
		mutedRepos: state.mutedRepos,
		offline: state.offline,
		errors: state.errors,
		token: state.token,
		lastSuccessfulCheck: state.lastSuccessfulCheck,
		fetchingInProgress: state.fetchingInProgress,
		lastChecked: state.lastChecked,
		fetchInterval: state.fetchInterval,
		isAutoLoadEnabled: state.isAutoLoadEnabled,
		filterType: state.filterType,
	};
}

const actions = {
	markRead,
	markUnread,
	clearErrors,
	fetchNotifications,
	openUrl,
	checkForUpdates,
	setIcon,
	changeToken,
	changeAutoLoad,
	muteRepo,
	unmuteRepo,
	setFilterType,
};

export default connect(mapStateToProps, actions)(App);
