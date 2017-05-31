class State {
	constructor( reducer ) {
		this.reducer = reducer;
		this.callbacks = [];
		this.state = this.reducer( null, { type: false } );
	}

	dispatch( action ) {
		this.modifyState( this.state, action );
	}

	modifyState( state, action ) {
		this.state = this.reducer( state, action );
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
