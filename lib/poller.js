/* globals window */
const { secsToMs } = require( '../lib/helpers' );

class Poller {
	constructor( options = {} ) {
		const isWindow = typeof window !== 'undefined';
		const defaults = {
			pollWhen: () => {},
			pollFunction: () => {},
			setTimeout: isWindow ? window.setTimeout.bind( window ) : () => {},
			clearTimeout: isWindow ? window.clearTimeout.bind( window ) : () => {},
		};
		this.options = Object.assign( {}, defaults, options );
		this.pollRunner = null;
	}

	begin() {
		this.end();
		this.pollRunner = this.options.setTimeout( () => ( this.options.pollWhen() && this.options.pollFunction() ), secsToMs( 1 ) );
	}

	end() {
		this.pollRunner && this.options.clearTimeout( this.pollRunner );
	}
}

module.exports = {
	Poller,
};
