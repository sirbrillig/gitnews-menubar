const PropTypes = require( 'prop-types' );
const { ipcRenderer } = require( 'electron' );
const React = require( 'react' );
const { connect } = require( 'react-redux' );
const { markAllNotesSeen } = require( '../lib/reducer' );

const el = React.createElement;

class AppWrapper extends React.Component {
	constructor( props ) {
		super( props );
		ipcRenderer.on( 'menubar-click', this.props.markAllNotesSeen );
	}

	render() {
		return el( this.props.children, Object.assign( { version: this.props.version }, { quitApp: this.props.quitApp } ) );
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
