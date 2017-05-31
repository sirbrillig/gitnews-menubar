const debugFactory = require( 'debug' );
const debug = debugFactory( 'gitnews-menubar' );

class State {
	constructor( reducer ) {
		this.reducer = reducer;
		this.callbacks = [];
		this.state = this.reducer( null, { type: false } );
		this.dispatch = this.dispatch.bind( this );
	}

	dispatch( action ) {
		debug( 'action:', action );
		this.modifyState( this.state, action );
	}

	modifyState( state, action ) {
		this.state = this.reducer( state, action );
		debug( 'new state:', this.state );
		this.emitChange();
	}

	addCallback( callback ) {
		this.callbacks.push( callback );
	}

	emitChange() {
		this.callbacks.map( callback => callback() );
	}

	getState() {
		return this.state;
	}
}

module.exports = State;
