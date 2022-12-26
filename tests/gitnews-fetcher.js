/* globals describe, it */
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('chai-sinon');
chai.use(sinonChai);
const { expect } = chai;
const { getErrorHandler } = require('../src/renderer/lib/gitnews-fetcher');

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

describe('handleFetchError()', function() {
	it('does nothing if the error is GitHubTokenNotFound', function() {
		const dispatch = sinon.spy();
		const handleFetchError = getErrorHandler(dispatch);
		handleFetchError({ code: 'GitHubTokenNotFound' });
		expect(dispatch).to.not.have.been.called;
	});

	it('enables offline mode if error is ENETDOWN', function() {
		const dispatch = sinon.spy();
		const handleFetchError = getErrorHandler(dispatch);
		handleFetchError({ code: 'ENETDOWN' });
		expect(dispatch).to.have.been.calledWith({ type: 'OFFLINE' });
	});

	it('enables offline mode if error is ENOTFOUND', function() {
		const dispatch = sinon.spy();
		const handleFetchError = getErrorHandler(dispatch);
		handleFetchError({ code: 'ENOTFOUND' });
		expect(dispatch).to.have.been.calledWith({ type: 'OFFLINE' });
	});

	it('does not enable offline mode if error is unknown', function() {
		const dispatch = sinon.spy();
		const handleFetchError = getErrorHandler(dispatch);
		handleFetchError({ code: 'random-string' });
		expect(dispatch).to.not.have.been.calledWith({ type: 'OFFLINE' });
	});

	it('adds new error if error is unknown', function() {
		const dispatch = sinon.spy();
		const handleFetchError = getErrorHandler(dispatch);
		handleFetchError({ code: 'random-string' });
		expect(dispatch).to.have.been.calledWith(
			sinon.match({ type: 'ADD_CONNECTION_ERROR' })
		);
	});

	it('adds new error with message if error is unknown', function() {
		const dispatch = sinon.spy();
		const handleFetchError = getErrorHandler(dispatch);
		handleFetchError({ message: 'random-string' });
		expect(dispatch).to.have.been.calledWith(
			sinon.match({ error: sinon.match('random-string') })
		);
	});

	it('adds new error with statusText if error is unknown', function() {
		const dispatch = sinon.spy();
		const handleFetchError = getErrorHandler(dispatch);
		handleFetchError({ statusText: 'random-string' });
		expect(dispatch).to.have.been.calledWith(
			sinon.match({ error: sinon.match('random-string') })
		);
	});

	it('enables offline mode if error is a 500 error from GitHub', function() {
		const dispatch = sinon.spy();
		const handleFetchError = getErrorHandler(dispatch);
		handleFetchError({ status: 501 });
		expect(dispatch).to.have.been.calledWith(sinon.match({ type: 'OFFLINE' }));
	});
});
