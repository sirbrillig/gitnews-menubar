/* globals window */
const React = require( 'react' );
const el = React.createElement;
const date = require( 'date-fns' );
const debugFactory = require( 'debug' );
const debug = debugFactory( 'gitnews-menubar' );

class LastChecked extends React.Component {
	constructor( props ) {
		super( props );
		this.lastCheckedUpdater = null;
		this.updateInterval = 30000; // 30 seconds in ms
		this.updateTimestamp = this.updateTimestamp.bind( this );
		this.state = { lastUpdated: 0 };
	}

	componentDidMount() {
		if ( this.lastCheckedUpdater ) {
			window.clearInterval( this.lastCheckedUpdater );
		}
		this.lastCheckedUpdater = window.setInterval( () => this.updateTimestamp(), this.updateInterval );
	}

	componentWillUnmount() {
		if ( this.lastCheckedUpdater ) {
			window.clearInterval( this.lastCheckedUpdater );
		}
	}

	updateTimestamp() {
		debug( 'updating LastChecked timestamp', this.state );
		// Just a hack to force re-rendering
		this.setState( { lastUpdated: Date.now() } );
	}

	render() {
		const lastChecked = this.props.lastChecked;
		if ( ! lastChecked ) {
			return null;
		}
		const lastCheckedString = date.distanceInWords( Date.now(), date.parse( lastChecked ), { addSuffix: true } );
		debug( 'updating LastChecked display for', lastChecked, lastCheckedString );
		return el( 'div', { className: 'last-checked' },
			'last checked: ' + lastCheckedString
		);
	}
}

module.exports = LastChecked;
