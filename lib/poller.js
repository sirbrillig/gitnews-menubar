/* globals window */
const debugFactory = require( 'debug' );
const { secsToMs } = require( '../lib/helpers' );

const debug = debugFactory( 'gitnews-menubar' );

function getMaybePoll( { pollWhen, pollFunction } ) {
	return function maybePoll() {
		if ( pollWhen() ) {
			debug( 'calling pollFunction' );
			pollFunction();
		}
	};
}

class Poller {
	constructor( options = {} ) {
		const isWindow = typeof window !== 'undefined';
		const defaults = {
			pollWhen: () => {},
			pollFunction: () => {},
			setInterval: isWindow ? window.setInterval.bind( window ) : () => {},
			clearInterval: isWindow ? window.clearInterval.bind( window ) : () => {},
		};
		this.options = Object.assign( {}, defaults, options );
		this.pollRunner = null;
	}

	begin() {
		this.end();
		const { pollWhen, pollFunction } = this.options;
		this.pollRunner = this.options.setInterval( getMaybePoll( { pollWhen, pollFunction } ), secsToMs( 1 ) );
	}

	end() {
		this.pollRunner && this.options.clearInterval( this.pollRunner );
	}
}

module.exports = {
	Poller,
};
