/* globals describe, it */
import { getErrorMessage, isOfflineCode } from '../src/renderer/lib/helpers';

describe('getErrorMessage()', function () {
	it('returns the error if the error is a string', function () {
		expect(getErrorMessage('hello world')).toEqual('hello world');
	});

	it('returns the error code if one is set', function () {
		const err = { code: 'YOYOYO' };
		expect(getErrorMessage(err)).toEqual(err.code);
	});

	it('returns the error status if one is set', function () {
		const err = { status: 'YOYOYO' };
		expect(getErrorMessage(err)).toEqual(err.status);
	});

	it('returns the error statusText if one is set', function () {
		const err = { statusText: 'YOYOYO' };
		expect(getErrorMessage(err)).toEqual(err.statusText);
	});

	it('returns the error message if one is set', function () {
		const err = { message: 'YOYOYO' };
		expect(getErrorMessage(err)).toEqual(err.message);
	});

	it('returns the error status and statusText if set', function () {
		const err = { status: 501, statusText: 'YOYOYO' };
		expect(getErrorMessage(err)).toEqual(`${err.status}; ${err.statusText}`);
	});

	it('returns the error status and statusText and url if set', function () {
		const err = { url: 'http://google.com', status: 501, statusText: 'YOYOYO' };
		expect(getErrorMessage(err)).toEqual(
			`${err.status}; ${err.statusText}; for url ${err.url}`
		);
	});
});

describe('isOfflineCode()', function () {
	it('returns true if the code is ENETDOWN', function () {
		expect(isOfflineCode('ENETDOWN')).toBeTruthy();
	});

	it('returns false if the code is missing', function () {
		expect(isOfflineCode(null)).toBeFalsy();
	});
});
