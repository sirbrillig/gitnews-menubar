/* globals describe, it */
import { getErrorHandler } from '../src/renderer/lib/gitnews-fetcher';

window.electronApi = {
	quitApp: () => undefined,
	logMessage: () => undefined,
	toggleAutoLaunch: () => undefined,
	openUrl: () => undefined,
	saveToken: () => undefined,
	setIcon: () => undefined,
	onHide: () => undefined,
	onShow: () => undefined,
	onClick: () => undefined,
	getToken: () => Promise.resolve(''),
	getVersion: () => Promise.resolve('v1'),
	isDemoMode: () => Promise.resolve(false),
	isAutoLaunchEnabled: () => Promise.resolve(false),
};

describe('handleFetchError()', function () {
	it('does nothing if the error is GitHubTokenNotFound', function () {
		const dispatch = jest.fn();
		const handleFetchError = getErrorHandler(dispatch);
		handleFetchError({ code: 'GitHubTokenNotFound' });
		expect(dispatch).not.toHaveBeenCalled();
	});

	it('enables offline mode if error is ENETDOWN', function () {
		const dispatch = jest.fn();
		const handleFetchError = getErrorHandler(dispatch);
		handleFetchError({ code: 'ENETDOWN' });
		expect(dispatch).toHaveBeenCalledWith({ type: 'OFFLINE' });
	});

	it('enables offline mode if error is ENOTFOUND', function () {
		const dispatch = jest.fn();
		const handleFetchError = getErrorHandler(dispatch);
		handleFetchError({ code: 'ENOTFOUND' });
		expect(dispatch).toHaveBeenCalledWith({ type: 'OFFLINE' });
	});

	it('does not enable offline mode if error is unknown', function () {
		const dispatch = jest.fn();
		const handleFetchError = getErrorHandler(dispatch);
		handleFetchError({ code: 'random-string' });
		expect(dispatch).not.toHaveBeenCalledWith({ type: 'OFFLINE' });
	});

	it('adds new error if error is unknown', function () {
		const dispatch = jest.fn();
		const handleFetchError = getErrorHandler(dispatch);
		handleFetchError({ code: 'random-string' });
		expect(dispatch).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'ADD_CONNECTION_ERROR' })
		);
	});

	it('adds new error with message if error is unknown', function () {
		const dispatch = jest.fn();
		const handleFetchError = getErrorHandler(dispatch);
		handleFetchError({ message: 'random-string' });
		expect(dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expect.stringContaining('random-string'),
			})
		);
	});

	it('adds new error with statusText if error is unknown', function () {
		const dispatch = jest.fn();
		const handleFetchError = getErrorHandler(dispatch);
		handleFetchError({ statusText: 'random-string' });
		expect(dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				error: expect.stringContaining('random-string'),
			})
		);
	});

	it('enables offline mode if error is a 500 error from GitHub', function () {
		const dispatch = jest.fn();
		const handleFetchError = getErrorHandler(dispatch);
		handleFetchError({ status: 501 });
		expect(dispatch).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'OFFLINE' })
		);
	});
});
