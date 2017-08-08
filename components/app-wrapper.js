/* globals window */
const PropTypes = require( 'prop-types' );
require( 'dotenv' ).config();
const { get } = require( 'lodash' );
const { remote, ipcRenderer } = require( 'electron' );
const semver = require( 'semver' );
const React = require( 'react' );
const { connect } = require( 'react-redux' );
const debugFactory = require( 'debug' );
const debug = debugFactory( 'gitnews-menubar' );
const { msToSecs } = require( '../lib/helpers' );
const {
	changeToken,
	changeToOffline,
	gotNotes,
	addConnectionError,
	markAllNotesSeen,
	fetchBegin,
	fetchDone,
	openUrl,
} = require( '../lib/reducer' );

const el = React.createElement;

class AppWrapper extends React.Component {
	constructor( props ) {
		super( props );

		// TODO: make all these redux actions
		this.writeToken = this.writeToken.bind( this );
		this.setIcon = this.setIcon.bind( this );
		this.getSecondsUntilNextFetch = this.getSecondsUntilNextFetch.bind( this );
		this.checkForUpdates = this.checkForUpdates.bind( this );

		ipcRenderer.on( 'menubar-click', this.props.markAllNotesSeen );
	}

	setIcon( nextIcon ) {
		ipcRenderer.send( 'set-icon', nextIcon );
	}

	writeToken( token ) {
		debug( 'writing new token' );
		this.props.setToken( token );
		this.props.changeToken( token );
	}

	getSecondsUntilNextFetch() {
		const lastChecked = get( this.props, 'lastChecked', 0 );
		const interval = ( this.props.fetchInterval - ( this.props.now() - lastChecked ) );
		return ( interval < 0 ) ? 0 : msToSecs( interval );
	}

	checkForUpdates() {
		this.props.checkForUpdates( { fetch: window.fetch, version: this.props.version, semver } )
			.then( response => {
				if ( ! response.updateAvailable ) {
					remote.dialog.showMessageBox( {
						type: 'info',
						message: `You have the latest version of Gitnews, ${ response.oldVersion }!`,
					} );
					return;
				}
				const confirm = remote.dialog.showMessageBox( {
					type: 'question',
					message: 'A new version ' + response.newVersion + ' of Gitnews is available.',
					detail: 'Do you want to download it now?',
					buttons: [ 'Yes', 'No' ]
				} );
				if ( confirm === 0 ) {
					this.props.openUrl( 'https://github.com/sirbrillig/gitnews-menubar/releases' );
				}
			} )
			.catch( err => {
				console.error( 'Error while checking for updates:', err );
			} );
	}

	getActions() {
		return {
			writeToken: this.writeToken,
			quitApp: this.props.quitApp,
			getSecondsUntilNextFetch: this.getSecondsUntilNextFetch,
			checkForUpdates: this.checkForUpdates,
			setIcon: this.setIcon,
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
	checkForUpdates: PropTypes.func.isRequired,
	setToken: PropTypes.func.isRequired,
	// All following are provided by connect
	openUrl: PropTypes.func.isRequired,
	markAllNotesSeen: PropTypes.func.isRequired,
	changeToken: PropTypes.func.isRequired,
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
	token: PropTypes.string,
	lastChecked: PropTypes.oneOfType( [ PropTypes.number, PropTypes.bool ] ),
};

function mapStateToProps( state ) {
	return {
		fetchInterval: state.fetchInterval,
		fetchingInProgress: state.fetchingInProgress,
		token: state.token,
		lastChecked: state.lastChecked,
	};
}

const actions = {
	markAllNotesSeen,
	changeToken,
	changeToOffline,
	gotNotes,
	fetchBegin,
	fetchDone,
	addConnectionError,
	openUrl,
};

module.exports = connect( mapStateToProps, actions )( AppWrapper );
