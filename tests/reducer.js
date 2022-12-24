/* globals describe, it, beforeEach */
const { createReducer } = require('../src/renderer/lib/reducer');
const { secsToMs } = require('../src/renderer/lib/helpers');
const { expect } = require('chai');

const reducer = createReducer('');

describe('reducer', function() {
	describe('CLEAR_ERRORS', function() {
		it('empties all errors', function() {
			const action = { type: 'CLEAR_ERRORS' };
			const result = reducer({ errors: ['an error'] }, action);
			expect(result.errors).to.be.empty;
		});
	});

	describe('MARK_NOTE_READ', function() {
		it('marks the note as read', function() {
			const notes = [
				{ id: 'a1', unread: true, title: 'test note 1' },
				{ id: 'a2', unread: false, title: 'test note 2' },
				{ id: 'a3', unread: true, title: 'test note 3' },
			];
			const action = { type: 'MARK_NOTE_READ', note: notes[0] };
			const result = reducer({ notes }, action);
			expect(result.notes[0].unread).to.be.false;
		});

		it('does not affect other notes', function() {
			const notes = [
				{ id: 'a1', unread: true, title: 'test note 1' },
				{ id: 'a2', unread: false, title: 'test note 2' },
				{ id: 'a3', unread: true, title: 'test note 3' },
			];
			const action = { type: 'MARK_NOTE_READ', note: notes[0] };
			const result = reducer({ notes }, action);
			expect(result.notes[1].unread).to.be.false;
			expect(result.notes[2].unread).to.be.true;
		});
	});

	describe('NOTES_RETRIEVED', function() {
		const now = Date.parse('2017-08-12');
		let notes = [];

		beforeEach(function() {
			notes = [
				{ id: 'a1', unread: true, title: 'test note 1', updatedAt: now },
				{ id: 'a2', unread: false, title: 'test note 2', updatedAt: now },
				{ id: 'a3', unread: true, title: 'test note 3', updatedAt: now },
			];
		});

		it('disables offline mode', function() {
			const action = { type: 'NOTES_RETRIEVED', notes };
			const result = reducer({ notes: [], offline: true }, action);
			expect(result.offline).to.be.false;
		});

		it('sets lastChecked date', function() {
			const action = { type: 'NOTES_RETRIEVED', notes };
			const result = reducer({ notes: [] }, action);
			expect(result.lastChecked).to.exist;
		});

		it('sets lastSuccessfulCheck date', function() {
			const action = { type: 'NOTES_RETRIEVED', notes };
			const result = reducer({ notes: [] }, action);
			expect(result.lastSuccessfulCheck).to.exist;
		});

		it('resets fetchRetryCount to 0', function() {
			const action = { type: 'NOTES_RETRIEVED', notes };
			const result = reducer({ notes: [], fetchRetryCount: 11 }, action);
			expect(result.fetchRetryCount).to.equal(0);
		});

		it('clears errors', function() {
			const action = { type: 'NOTES_RETRIEVED', notes };
			const result = reducer({ notes: [], errors: ['a1', 'a2'] }, action);
			expect(result.errors).to.be.empty;
		});

		it('changes fetchInterval to the default', function() {
			const action = { type: 'NOTES_RETRIEVED', notes };
			const result = reducer({ notes: [], fetchInterval: 9999 }, action);
			expect(result.fetchInterval).to.not.equal(9999);
		});

		it('saves new notifications', function() {
			const action = { type: 'NOTES_RETRIEVED', notes };
			const result = reducer({ notes: [] }, action);
			expect(result.notes).to.have.length(3);
		});

		it('removes notifications not in new data', function() {
			const action = { type: 'NOTES_RETRIEVED', notes };
			const result = reducer(
				{ notes: [{ id: 'o1', title: 'test note' }] },
				action
			);
			expect(result.notes.map(note => note.id)).to.not.include('o1');
		});

		it('preserves `markedUnread` state for existing notifications', function() {
			const action = { type: 'NOTES_RETRIEVED', notes };
			const result = reducer(
				{
					notes: [{ id: 'a1', title: 'test note', gitnewsMarkedUnread: true }],
				},
				action
			);
			expect(
				result.notes.filter(note => note.gitnewsMarkedUnread)
			).to.have.length(1);
		});

		it('preserves `seen` state for existing notifications', function() {
			const action = { type: 'NOTES_RETRIEVED', notes };
			const result = reducer(
				{ notes: [{ id: 'a1', title: 'test note', gitnewsSeen: true }] },
				action
			);
			expect(result.notes.filter(note => note.gitnewsSeen)).to.have.length(1);
		});

		it('replaces `seen` state for existing notifications with updates', function() {
			const longAgo = Date.parse('2017-08-01');
			const action = { type: 'NOTES_RETRIEVED', notes };
			const result = reducer(
				{
					notes: [
						{
							id: 'a1',
							title: 'test note',
							gitnewsSeen: true,
							updatedAt: longAgo,
							gitnewsSeenAt: longAgo,
						},
					],
				},
				action
			);
			expect(result.notes.filter(note => note.gitnewsSeen)).to.have.length(0);
		});
	});

	describe('OFFLINE', function() {
		it('sets offline to true', function() {
			const action = { type: 'OFFLINE' };
			const result = reducer({ offline: false }, action);
			expect(result.offline).to.be.true;
		});

		it('sets lastChecked date', function() {
			const action = { type: 'OFFLINE' };
			const result = reducer({ offline: false }, action);
			expect(result.lastChecked).to.exist;
		});

		it('does not set lastSuccessfulCheck date', function() {
			const action = { type: 'OFFLINE' };
			const result = reducer({ offline: false }, action);
			expect(result.lastSuccessfulCheck).to.not.exist;
		});

		it('sets fetchInterval to 60 secs', function() {
			const action = { type: 'OFFLINE' };
			const result = reducer({ offline: false, fetchRetryCount: 0 }, action);
			expect(result.fetchInterval).to.equal(secsToMs(60));
		});

		it('increases fetchRetryCount by 1', function() {
			const action = { type: 'OFFLINE' };
			const result = reducer({ offline: false, fetchRetryCount: 4 }, action);
			expect(result.fetchRetryCount).to.equal(5);
		});

		it('sets fetchInterval to 60 seconds multiplied by number of tries', function() {
			const action = { type: 'OFFLINE' };
			const result = reducer({ offline: false, fetchRetryCount: 2 }, action);
			expect(result.fetchInterval).to.equal(secsToMs(180));
		});
	});

	describe('ADD_CONNECTION_ERROR', function() {
		it('adds the error string to the list of errors', function() {
			const action = { type: 'ADD_CONNECTION_ERROR', error: 'foobar' };
			const result = reducer({ errors: ['barfoo'] }, action);
			expect(result.errors).to.eql(['barfoo', 'foobar']);
		});

		it('sets lastChecked date', function() {
			const action = { type: 'ADD_CONNECTION_ERROR', error: 'foobar' };
			const result = reducer({ errors: ['barfoo'] }, action);
			expect(result.lastChecked).to.exist;
		});
	});
});
