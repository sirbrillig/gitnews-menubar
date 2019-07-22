/* globals window */
const React = require( 'react' );
const el = React.createElement;
const { secsToMs } = require( '../lib/helpers' );
const { useState, useEffect } = React;

function createUpdater( WrappedComponent ) {
	let lastCheckedUpdater = null;
	return ( props ) => {
		const updateInterval = secsToMs( 1 );
		const [ lastUpdated, setLastUpdated ] = useState( 0 );
		useEffect( () => {
			lastCheckedUpdater && window.clearInterval( lastCheckedUpdater );
			lastCheckedUpdater = window.setInterval( () => setLastUpdated( Date.now() ), updateInterval );
			return () => {
				lastCheckedUpdater && window.clearInterval( lastCheckedUpdater );
			};
		}, [] );
		return el( WrappedComponent, Object.assign( { componentLastUpdated: lastUpdated }, props ) );
	};
}

module.exports = createUpdater;

