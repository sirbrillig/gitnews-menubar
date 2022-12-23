import React from 'react';
import { connect } from 'react-redux';
import debugFactory from 'debug';
import Header from '../components/header';
import ErrorsArea from '../components/errors-area';
import MainPane from '../components/main-pane';
import {
	PANE_CONFIG,
	PANE_NOTIFICATIONS,
	PANE_TOKEN,
	PANE_MUTED_REPOS,
} from '../lib/constants';
import Poller from '../lib/poller';
import { getSecondsUntilNextFetch } from '../lib/helpers';
import {
	markRead,
	markUnread,
	clearErrors,
	fetchNotifications,
	openUrl,
	setIcon,
	changeToken,
	changeAutoLoad,
	muteRepo,
	unmuteRepo,
	setFilterType,
} from '../lib/reducer';
import SearchNotifications from './search-notifications';
import doesNoteMatchFilter from '../lib/does-note-match-filter';
import {
	Note,
	AppReduxState,
	AppPane,
	OpenUrl,
	MarkRead,
	MarkUnread,
	ChangeAutoload,
	MuteRepo,
	UnmuteRepo,
} from '../types';

const debug = debugFactory('gitnews-menubar');

interface AppProps {
	quitApp: () => void;
	getVersion: () => Promise<string>;

	// All following are provided by connect
	changeToken: (token: string) => void;
	setIcon: (icon: string) => void;
	openUrl: OpenUrl;
	fetchNotifications: () => void;
	markRead: MarkRead;
	markUnread: MarkUnread;
	clearErrors: () => void;
	changeAutoLoad: ChangeAutoload;
	muteRepo: MuteRepo;
	unmuteRepo: UnmuteRepo;
	setFilterType: (type: string) => void;
	notes: Note[];
	mutedRepos: string[];
	offline: boolean;
	errors: string[];
	token: string | undefined;
	lastSuccessfulCheck: number | false;
	fetchingInProgress: boolean;
	lastChecked: number | false;
	fetchInterval: number;
	isAutoLoadEnabled: boolean;
	filterType: string;
	appVisible: boolean;
}

interface AppState {
	currentPane: AppPane;
	searchValue: string;
}

class App extends React.Component<AppProps, AppState> {
	fetcher: Poller;

	constructor(props: AppProps) {
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

	getNextIcon({
		offline,
		errors,
		unseenNotes,
		unreadNotes,
		filterType,
	}: {
		offline: boolean;
		errors: string[];
		unseenNotes: Note[];
		unreadNotes: Note[];
		filterType: string;
	}) {
		if (errors.length) {
			return 'error';
		}
		const unseenNotesFiltered = unseenNotes.filter(note =>
			doesNoteMatchFilter(note, filterType)
		);
		if (unseenNotesFiltered.length) {
			return 'unseen';
		}
		const unreadNotesFiltered = unreadNotes.filter(note =>
			doesNoteMatchFilter(note, filterType)
		);
		if (unreadNotesFiltered.length) {
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
			getVersion,
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
			filterType: this.props.filterType,
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
		const setSearchTo = (value: string) =>
			this.setState({ searchValue: value });

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
					currentPane={currentPane}
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
					getVersion={getVersion}
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
					isAutoLoadEnabled={this.props.isAutoLoadEnabled}
					changeAutoLoad={this.props.changeAutoLoad}
					muteRepo={this.props.muteRepo}
					unmuteRepo={this.props.unmuteRepo}
					mutedRepos={this.props.mutedRepos}
					showMutedReposList={showMutedReposList}
					searchValue={this.state.searchValue}
					filterType={this.props.filterType}
					appVisible={this.props.appVisible}
				/>
			</main>
		);
	}
}

function mapStateToProps(state: AppReduxState) {
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
		appVisible: state.appVisible,
	};
}

const actions = {
	markRead,
	markUnread,
	clearErrors,
	fetchNotifications,
	openUrl,
	setIcon,
	changeToken,
	changeAutoLoad,
	muteRepo,
	unmuteRepo,
	setFilterType,
};

export default connect(mapStateToProps, actions)(App);
