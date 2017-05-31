/* globals describe, it */
const { reducer } = require( '../lib/reducer' );
const { expect } = require( 'chai' );

describe( 'reducer', function() {
	describe( 'CLEAR_ERRORS', function() {
		it( 'empties all errors', function() {
			const action = { type: 'CLEAR_ERRORS' };
			const result = reducer( { errors: [ 'an error' ] }, action );
			expect( result.errors ).to.be.empty;
		} );
	} );

	describe( 'MARK_NOTE_READ', function() {
		it( 'marks the note as read', function() {
			const notes = [
				{ id: 'a1', unread: true, title: 'test note 1' },
				{ id: 'a2', unread: false, title: 'test note 2' },
				{ id: 'a3', unread: true, title: 'test note 3' },
			];
			const action = { type: 'MARK_NOTE_READ', note: notes[ 0 ] };
			const result = reducer( { notes }, action );
			expect( result.notes[ 0 ].unread ).to.be.false;
		} );

		it( 'does not affect other notes', function() {
			const notes = [
				{ id: 'a1', unread: true, title: 'test note 1' },
				{ id: 'a2', unread: false, title: 'test note 2' },
				{ id: 'a3', unread: true, title: 'test note 3' },
			];
			const action = { type: 'MARK_NOTE_READ', note: notes[ 0 ] };
			const result = reducer( { notes }, action );
			expect( result.notes[ 1 ].unread ).to.be.false;
			expect( result.notes[ 2 ].unread ).to.be.true;
		} );
	} );
} );
