const PropTypes = require( 'prop-types' );
require( 'dotenv' ).config();
const { get } = require( 'lodash' );
const { ipcRenderer } = require( 'electron' );
const React = require( 'react' );
const { connect } = require( 'react-redux' );
const { msToSecs } = require( '../lib/helpers' );
const {
	changeToOffline,
	gotNotes,
	addConnectionError,
	markAllNotesSeen,
	fetchBegin,
	fetchDone,
} = require( '../lib/reducer' );

const el = React.createElement;

class AppWrapper extends React.Component {
	constructor( props ) {
		super( props );

		// TODO: make all these redux actions
		this.getSecondsUntilNextFetch = this.getSecondsUntilNextFetch.bind( this );

		ipcRenderer.on( 'menubar-click', this.props.markAllNotesSeen );
	}

	getSecondsUntilNextFetch() {
		const lastChecked = get( this.props, 'lastChecked', 0 );
		const interval = ( this.props.fetchInterval - ( this.props.now() - lastChecked ) );
		return ( interval < 0 ) ? 0 : msToSecs( interval );
	}

	getActions() {
		return {
			quitApp: this.props.quitApp,
			getSecondsUntilNextFetch: this.getSecondsUntilNextFetch,
		};
	}

	render() {
		return el( this.props.children, Object.assign( { version: this.props.version }, this.getActions() ) );
	}
}

AppWrapper.propTypes = {
	// Functions
	now: PropTypes.func.isRequired,
	quitApp: PropTypes.func.isRequired,
	// All following are provided by connect
	markAllNotesSeen: PropTypes.func.isRequired,
	changeToOffline: PropTypes.func.isRequired,
	gotNotes: PropTypes.func.isRequired,
	fetchBegin: PropTypes.func.isRequired,
	fetchDone: PropTypes.func.isRequired,
	addConnectionError: PropTypes.func.isRequired,

	// Values
	version: PropTypes.string.isRequired,
	// All following are provided by connect
	fetchingInProgress: PropTypes.bool.isRequired,
	fetchInterval: PropTypes.number.isRequired,
	lastChecked: PropTypes.oneOfType( [ PropTypes.number, PropTypes.bool ] ),
};

function mapStateToProps( state ) {
	return {
		fetchInterval: state.fetchInterval,
		fetchingInProgress: state.fetchingInProgress,
		lastChecked: state.lastChecked,
	};
}

const actions = {
	markAllNotesSeen,
	changeToOffline,
	gotNotes,
	fetchBegin,
	fetchDone,
	addConnectionError,
};

module.exports = connect( mapStateToProps, actions )( AppWrapper );
