/* globals describe, it */
const {
	getErrorMessage,
	isOfflineCode,
	findNoteInNotes,
	hasNoteUpdated,
	isNoteOutdated,
} = require('../src/common/lib/helpers');
const { expect } = require('chai');

describe('getErrorMessage()', function() {
	it('returns the error if the error is a string', function() {
		expect(getErrorMessage('hello world')).to.equal('hello world');
	});

	it('returns the error code if one is set', function() {
		const err = { code: 'YOYOYO' };
		expect(getErrorMessage(err)).to.equal(err.code);
	});

	it('returns the error status if one is set', function() {
		const err = { status: 'YOYOYO' };
		expect(getErrorMessage(err)).to.equal(err.status);
	});

	it('returns the error statusText if one is set', function() {
		const err = { statusText: 'YOYOYO' };
		expect(getErrorMessage(err)).to.equal(err.statusText);
	});

	it('returns the error message if one is set', function() {
		const err = { message: 'YOYOYO' };
		expect(getErrorMessage(err)).to.equal(err.message);
	});

	it('returns the error status and statusText if set', function() {
		const err = { status: 501, statusText: 'YOYOYO' };
		expect(getErrorMessage(err)).to.equal(`${err.status}; ${err.statusText}`);
	});

	it('returns the error status and statusText and url if set', function() {
		const err = { url: 'http://google.com', status: 501, statusText: 'YOYOYO' };
		expect(getErrorMessage(err)).to.equal(
			`${err.status}; ${err.statusText}; for url ${err.url}`
		);
	});
});

describe('isOfflineCode()', function() {
	it('returns true if the code is ENETDOWN', function() {
		expect(isOfflineCode('ENETDOWN')).to.be.ok;
	});

	it('returns false if the code is missing', function() {
		expect(isOfflineCode(null)).to.be.not.ok;
	});
});

describe('findNoteInNotes()', function() {
	const notes = [
		{ id: 'a1', unread: true, title: 'test note 1' },
		{ id: 'a2', unread: false, title: 'test note 2' },
		{ id: 'a3', unread: true, title: 'test note 3' },
	];
	it('returns match if found', function() {
		expect(findNoteInNotes(notes[0], notes)).to.equal(notes[0]);
	});

	it('returns undefined if not found', function() {
		expect(findNoteInNotes({ ...notes[0], id: 'other1' }, notes)).to.be
			.undefined;
	});
});

describe('hasNoteUpdated()', function() {
	const note = {
		id: 'a1',
		unread: true,
		title: 'test note 1',
		updatedAt: new Date(Date.now() - 10000),
	};
	it('returns true if a note has been updated', function() {
		expect(hasNoteUpdated({ ...note, updatedAt: new Date() }, note)).to.be.true;
	});

	it('returns false if a note has not been updated', function() {
		expect(hasNoteUpdated(note, note)).to.be.false;
	});
});

describe('isNoteOutdated()', function() {
	const note = {
		id: 'a1',
		unread: true,
		title: 'test note 1',
		updatedAt: new Date(Date.now() - 10000),
	};
	const earlierDate = new Date();
	earlierDate.setDate(earlierDate.getDate() - 200);

	it('returns true if a note is older than 6 months old', function() {
		expect(isNoteOutdated({ ...note, updatedAt: earlierDate })).to.be.true;
	});

	it('returns false if a note is younger than 6 months old', function() {
		expect(isNoteOutdated(note)).to.be.false;
	});
});
