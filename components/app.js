const AutoLaunch = require( 'auto-launch' );
const React = require( 'react' );
const { connect } = require( 'react-redux' );
const PropTypes = require( 'prop-types' );
const debugFactory = require( 'debug' );
const Header = require( '../components/header' );
const ErrorsArea = require( '../components/errors-area' );
const MainPane = require( '../components/main-pane' );
const { PANE_CONFIG, PANE_NOTIFICATIONS } = require( '../lib/constants' );
const { Poller } = require( '../lib/poller' );
const { getSecondsUntilNextFetch } = require( '../lib/helpers' );
const {
	hideEditToken,
	showEditToken,
	hideConfig,
	showConfig,
	markRead,
	clearErrors,
	fetchNotifications,
	openUrl,
	checkForUpdates,
	setIcon,
	changeToken,
	changeAutoLoad,
} = require( '../lib/reducer' );

const debug = debugFactory( 'gitnews-menubar' );
const el = React.createElement;

class App extends React.Component {
	constructor( props ) {
		super( props );
		this.shouldComponentPoll = this.shouldComponentPoll.bind( this );
		this.fetcher = new Poller( {
			pollWhen: this.shouldComponentPoll,
			pollFunction: () => props.fetchNotifications(),
		} );
	}

	componentDidMount() {
		debug( 'App mounted' );
		this.fetcher.begin();
		const autoLauncher = new AutoLaunch( { name: 'Gitnews' } );
		autoLauncher.isEnabled()
			.then( ( isEnabled ) => {
				this.props.changeAutoLoad( isEnabled );
			} )
			.catch( function( err ) {
				console.error( 'failed to fetch autoload', err );
				// TODO: maybe send to sentry?
			} );
	}

	componentWillUnmount() {
		this.fetcher.end();
	}

	shouldComponentPoll() {
		return ( getSecondsUntilNextFetch( this.props.lastChecked, this.props.fetchInterval ) < 1 );
	}

	getReadNotifications() {
		return this.props.notes.filter( note => ! note.unread );
	}

	getUnreadNotifications() {
		return this.props.notes.filter( note => note.unread );
	}

	getUnseenNotifications() {
		return this.getUnreadNotifications().filter( note => ! note.gitnewsSeen );
	}

	getNextIcon( { offline, errors, unseenNotes } ) {
		if ( offline || errors.length ) {
			return 'error';
		}
		if ( unseenNotes.length ) {
			return 'unseen';
		}
		return 'normal';
	}

	render() {
		const { offline, errors, currentPane, token, lastSuccessfulCheck, version, fetchingInProgress } = this.props;
		const newNotes = this.getUnreadNotifications();
		const readNotes = this.getReadNotifications();
		const unseenNotes = this.getUnseenNotifications();
		const nextIcon = this.getNextIcon( { offline, errors, unseenNotes } );

		debug( 'sending set-icon', nextIcon );
		this.props.setIcon( nextIcon );

		return el( 'main', null,
			el( Header, {
				offline,
				fetchNotifications: this.props.fetchNotifications,
				lastSuccessfulCheck,
				lastChecked: this.props.lastChecked,
				fetchInterval: this.props.fetchInterval,
				showConfig: token && currentPane === PANE_NOTIFICATIONS && this.props.showConfig,
				hideConfig: token && currentPane === PANE_CONFIG && this.props.hideConfig,
				openUrl: this.props.openUrl,
			} ),
			el( ErrorsArea, { errors, clearErrors } ),
			el( MainPane, {
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
				checkForUpdates: this.props.checkForUpdates,
				isAutoLoadEnabled: this.props.isAutoLoadEnabled,
				changeAutoLoad: this.props.changeAutoLoad,
			} )
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
	lastSuccessfulCheck: PropTypes.oneOfType( [ PropTypes.number, PropTypes.bool ] ),
	fetchingInProgress: PropTypes.bool,
	lastChecked: PropTypes.oneOfType( [ PropTypes.number, PropTypes.bool ] ),
	fetchInterval: PropTypes.number,
	isAutoLoadEnabled: PropTypes.bool,
};

function mapStateToProps( state ) {
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
	clearErrors,
	fetchNotifications,
	openUrl,
	checkForUpdates,
	setIcon,
	changeToken,
	changeAutoLoad,
};

module.exports = connect( mapStateToProps, actions )( App );
