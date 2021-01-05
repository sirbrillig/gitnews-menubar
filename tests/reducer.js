/* globals describe, it, beforeEach */
const { reducer } = require('../src/common/lib/reducer');
const { secsToMs } = require('../src/common/lib/helpers');
const { expect } = require('chai');

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
		const earlierDate = new Date();
		earlierDate.setDate(earlierDate.getDate() - 60);
		let notes = [];

		beforeEach(function() {
			notes = [
				{
					id: 'a1',
					unread: true,
					title: 'test note 1',
					updatedAt: earlierDate,
				},
				{
					id: 'a2',
					unread: false,
					title: 'test note 2',
					updatedAt: earlierDate,
				},
				{
					id: 'a3',
					unread: true,
					title: 'test note 3',
					updatedAt: earlierDate,
				},
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

		it('saves notifications to the cache', function() {
			const action = { type: 'NOTES_RETRIEVED', notes };
			const result = reducer({ notes: [] }, action);
			expect(result.notes).to.have.length(notes.length);
		});

		it('preserves notifications already in the cache', function() {
			const action = { type: 'NOTES_RETRIEVED', notes };
			const result = reducer(
				{ notes: [{ id: 'o1', title: 'test note', updatedAt: earlierDate }] },
				action
			);
			expect(result.notes).to.have.length(notes.length + 1);
			expect(result.notes.map(note => note.id)).to.include('o1');
		});

		it('does not duplicate existing notifications if they also appear in new data', function() {
			const action = { type: 'NOTES_RETRIEVED', notes };
			const result = reducer({ notes: [notes[0]] }, action);
			const notesWithDuplicatedNoteId = result.notes.filter(
				note => note.id === notes[0].id
			);
			expect(result.notes).to.have.length(notes.length);
			expect(notesWithDuplicatedNoteId).to.have.length(1);
		});

		it('merges new notifications with existing notifications if they share an id', function() {
			const action = { type: 'NOTES_RETRIEVED', notes };
			const result = reducer(
				{ notes: [{ ...notes[0], title: 'original title' }] },
				action
			);
			const mergedNote = result.notes.find(note => note.id === notes[0].id);
			expect(mergedNote).to.have.property('title', notes[0].title);
		});

		it('removes new read notifications older than 6 months', function() {
			const longLongAgo = new Date();
			longLongAgo.setDate(earlierDate.getDate() - 200);
			const oldNote = {
				id: 'oldold1',
				title: 'very old',
				unread: false,
				updatedAt: longLongAgo,
			};
			const action = { type: 'NOTES_RETRIEVED', notes: [...notes, oldNote] };
			const result = reducer({ notes: [] }, action);
			expect(result.notes.find(note => note.id === oldNote.id)).to.be.undefined;
		});

		it('removes old read notifications older than 6 months', function() {
			const longLongAgo = new Date();
			longLongAgo.setDate(earlierDate.getDate() - 200);
			const oldNote = {
				id: 'oldold1',
				title: 'very old',
				unread: false,
				updatedAt: longLongAgo,
			};
			const action = { type: 'NOTES_RETRIEVED', notes };
			const result = reducer({ notes: [oldNote] }, action);
			expect(result.notes.find(note => note.id === oldNote.id)).to.be.undefined;
		});

		it('does not remove new unread notifications older than 6 months', function() {
			const longLongAgo = new Date();
			longLongAgo.setDate(earlierDate.getDate() - 200);
			const oldNote = {
				id: 'oldold1',
				title: 'very old',
				unread: true,
				updatedAt: longLongAgo,
			};
			const action = { type: 'NOTES_RETRIEVED', notes: [...notes, oldNote] };
			const result = reducer({ notes: [] }, action);
			expect(result.notes.find(note => note.id === oldNote.id)).to.not.be.null;
		});

		it('does not remove existing read notifications with `gitnewsMarkedUnread` older than 6 months', function() {
			const longLongAgo = new Date();
			longLongAgo.setDate(earlierDate.getDate() - 200);
			const oldNote = {
				id: 'oldold1',
				title: 'very old',
				unread: false,
				gitnewsMarkedUnread: true,
				updatedAt: longLongAgo,
			};
			const action = { type: 'NOTES_RETRIEVED', notes: [...notes, oldNote] };
			const result = reducer({ notes: [] }, action);
			expect(result.notes.find(note => note.id === oldNote.id)).to.not.be.null;
		});

		it('does not remove existing unread notifications older than 6 months', function() {
			const longLongAgo = new Date();
			longLongAgo.setDate(earlierDate.getDate() - 200);
			const oldNote = {
				id: 'oldold1',
				title: 'very old',
				unread: true,
				updatedAt: longLongAgo,
			};
			const action = { type: 'NOTES_RETRIEVED', notes };
			const result = reducer({ notes: [oldNote] }, action);
			expect(result.notes.find(note => note.id === oldNote.id)).to.not.be.null;
		});

		it('replaces `unread` when merging new and existing notifications when unread becomes true', function() {
			const action = {
				type: 'NOTES_RETRIEVED',
				notes: [{ ...notes[0], unread: true }],
			};
			const result = reducer(
				{ notes: [{ ...notes[0], unread: false }] },
				action
			);
			const mergedNote = result.notes.find(note => note.id === notes[0].id);
			expect(mergedNote).to.have.property('unread', true);
		});

		it('replaces `unread` when merging new and existing notifications when unread becomes false', function() {
			const action = {
				type: 'NOTES_RETRIEVED',
				notes: [{ ...notes[0], unread: false }],
			};
			const result = reducer(
				{ notes: [{ ...notes[0], unread: true }] },
				action
			);
			const mergedNote = result.notes.find(note => note.id === notes[0].id);
			expect(mergedNote).to.have.property('unread', false);
		});

		it('preserves `gitnewsMarkedUnread` when merging new and existing notifications', function() {
			const action = { type: 'NOTES_RETRIEVED', notes };
			const result = reducer(
				{
					notes: [{ ...notes[0], gitnewsMarkedUnread: true }],
				},
				action
			);
			const mergedNote = result.notes.find(note => note.id === notes[0].id);
			expect(mergedNote).to.have.property('gitnewsMarkedUnread', true);
		});

		it('preserves `gitnewsSeen` for when merging new and existing notifications and new notification has older date', function() {
			const action = { type: 'NOTES_RETRIEVED', notes };
			const result = reducer(
				{
					notes: [
						{
							...notes[0],
							gitnewsSeen: true,
							updatedAt: new Date(),
						},
					],
				},
				action
			);
			const mergedNote = result.notes.find(note => note.id === notes[0].id);
			expect(mergedNote).to.have.property('gitnewsSeen', true);
		});

		it('replaces `gitnewsSeen` when merging new and existing notifications and new notification has newer date', function() {
			const longAgo = new Date();
			longAgo.setDate(earlierDate.getDate() - 100);
			const action = { type: 'NOTES_RETRIEVED', notes };
			const result = reducer(
				{
					notes: [
						{
							...notes[0],
							gitnewsSeen: true,
							updatedAt: longAgo,
						},
					],
				},
				action
			);
			const mergedNote = result.notes.find(note => note.id === notes[0].id);
			expect(mergedNote).to.have.property('gitnewsSeen', false);
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
