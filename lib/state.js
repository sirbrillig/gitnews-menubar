class State {
	constructor( reducer ) {
		this.state = false;
		this.reducer = reducer;
		this.callbacks = [];
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
