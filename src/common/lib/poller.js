/* globals window */

class Poller {
	constructor( options = {} ) {
		const isWindow = typeof window !== 'undefined';
		const defaults = {
			pollFunction: () => false,
			setTimeout: isWindow ? window.setTimeout.bind( window ) : () => {},
			clearTimeout: isWindow ? window.clearTimeout.bind( window ) : () => {},
		};
		this.options = Object.assign( {}, defaults, options );
		this.pollRunner = null;
	}

	begin() {
		const runPoll = () => {
			this.end();
			if ( this.options.pollFunction() ) {
				this.pollRunner = this.options.setTimeout( runPoll, 1000 );
			}
		};
		runPoll();
	}

	end() {
		this.pollRunner && this.options.clearTimeout( this.pollRunner );
	}
}

module.exports = Poller;
