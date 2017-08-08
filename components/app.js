const React = require( 'react' );
const { connect } = require( 'react-redux' );
const PropTypes = require( 'prop-types' );
const debugFactory = require( 'debug' );
const Header = require( '../components/header' );
const ErrorsArea = require( '../components/errors-area' );
const MainPane = require( '../components/main-pane' );
const { PANE_CONFIG, PANE_NOTIFICATIONS } = require( '../lib/constants' );
const { Poller } = require( '../lib/poller' );
const {
	hideEditToken,
	showEditToken,
	hideConfig,
	showConfig,
	markRead,
	clearErrors,
	fetchNotifications,
	openUrl,
} = require( '../lib/reducer' );

const debug = debugFactory( 'gitnews-menubar' );
const el = React.createElement;

class App extends React.Component {
	constructor( props ) {
		super( props );
		this.fetcher = new Poller( {
			pollWhen: () => props.getSecondsUntilNextFetch() < 1,
			pollFunction: () => props.fetchNotifications(),
		} );
	}

	componentDidMount() {
		debug( 'App mounted' );
		this.fetcher.begin();
	}

	componentWillUnmount() {
		this.fetcher.end();
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
				showConfig: currentPane === PANE_NOTIFICATIONS && this.props.showConfig,
				hideConfig: currentPane === PANE_CONFIG && this.props.hideConfig,
				getSecondsUntilNextFetch: this.props.getSecondsUntilNextFetch,
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
				writeToken: this.props.writeToken,
				quitApp: this.props.quitApp,
				hideEditToken: this.props.hideEditToken,
				showEditToken: this.props.showEditToken,
				markRead: this.props.markRead,
				checkForUpdates: this.props.checkForUpdates,
			} )
		);
	}
}

App.propTypes = {
	// Actions
	writeToken: PropTypes.func.isRequired,
	quitApp: PropTypes.func.isRequired,
	getSecondsUntilNextFetch: PropTypes.func.isRequired,
	checkForUpdates: PropTypes.func.isRequired,
	setIcon: PropTypes.func.isRequired,
	// All following are provided by connect
	openUrl: PropTypes.func.isRequired,
	fetchNotifications: PropTypes.func.isRequired,
	markRead: PropTypes.func.isRequired,
	clearErrors: PropTypes.func.isRequired,
	showEditToken: PropTypes.func.isRequired,
	hideEditToken: PropTypes.func.isRequired,
	hideConfig: PropTypes.func.isRequired,
	showConfig: PropTypes.func.isRequired,

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
};

module.exports = connect( mapStateToProps, actions )( App );
