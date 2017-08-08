const PropTypes = require( 'prop-types' );
require( 'dotenv' ).config();
const { ipcRenderer } = require( 'electron' );
const React = require( 'react' );
const { connect } = require( 'react-redux' );
const { markAllNotesSeen } = require( '../lib/reducer' );

const el = React.createElement;

class AppWrapper extends React.Component {
	constructor( props ) {
		super( props );

		// TODO: make all these redux actions
		ipcRenderer.on( 'menubar-click', this.props.markAllNotesSeen );
	}

	getActions() {
		return {
			quitApp: this.props.quitApp,
		};
	}

	render() {
		return el( this.props.children, Object.assign( { version: this.props.version }, this.getActions() ) );
	}
}

AppWrapper.propTypes = {
	// Functions
	quitApp: PropTypes.func.isRequired,
	// All following are provided by connect
	markAllNotesSeen: PropTypes.func.isRequired,

	// Values
	version: PropTypes.string.isRequired,
};

const actions = {
	markAllNotesSeen,
};

module.exports = connect( null, actions )( AppWrapper );
