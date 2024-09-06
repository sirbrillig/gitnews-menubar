/* globals describe, it */
import Poller from '../src/renderer/lib/poller';

function getSinglePollFunction() {
	const pollFunction = jest.fn();
	pollFunction.mockReturnValue(true); // third and subsequent calls (2, etc)
	pollFunction.mockReturnValueOnce(true); // first call (0)
	pollFunction.mockReturnValueOnce(false); // second call (1)
	return pollFunction;
}

describe('Poller', function () {
	describe('.begin()', function () {
		it('starts a timer', function () {
			const setTimeout = jest.fn();
			const poller = new Poller({
				setTimeout,
				pollFunction: getSinglePollFunction(),
			});
			poller.begin();
			expect(setTimeout).toHaveBeenCalled();
		});

		it('calls pollFunction immediately', function () {
			const pollFunction = getSinglePollFunction();
			const setTimeout = (callBack) => callBack();
			const poller = new Poller({ pollFunction, setTimeout });
			poller.begin();
			expect(pollFunction).toHaveBeenCalled();
		});

		it('ends a running timer', function () {
			const setTimeout = jest.fn().mockReturnValue('foobar');
			const clearTimeout = jest.fn();
			const poller = new Poller({
				setTimeout,
				clearTimeout,
				pollFunction: getSinglePollFunction(),
			});
			poller.begin();
			poller.begin();
			expect(clearTimeout).toHaveBeenCalledWith('foobar');
		});

		it('calls pollFunction multiple times until pollFunction returns false', function () {
			const pollFunction = getSinglePollFunction();
			const setTimeout = (callBack) => callBack();
			const poller = new Poller({ pollFunction, setTimeout });
			poller.begin();
			expect(pollFunction).toHaveBeenCalledTimes(2);
		});

		it('calls pollFunction multiple times until pollFunction throws an error', function () {
			const pollFunction = jest.fn();
			pollFunction.mockImplementationOnce(() => true);
			pollFunction.mockImplementationOnce(() => true);
			pollFunction.mockImplementationOnce(() => {
				throw new Error('test error');
			});
			const setTimeout = (callBack) => callBack();
			const poller = new Poller({ pollFunction, setTimeout });
			let errorThrown = false;
			try {
				poller.begin();
			} catch (err) {
				errorThrown = true;
			}
			expect(pollFunction).toHaveBeenCalledTimes(3);
			expect(errorThrown).toBeTruthy();
		});
	});

	describe('.end()', function () {
		it('ends a running timer', function () {
			const setTimeout = jest.fn().mockReturnValue('foobar');
			const clearTimeout = jest.fn();
			const poller = new Poller({
				setTimeout,
				clearTimeout,
				pollFunction: getSinglePollFunction(),
			});
			poller.begin();
			poller.end();
			expect(clearTimeout).toHaveBeenCalledWith('foobar');
		});

		it('has no effect if no timer is running', function () {
			const setTimeout = jest.fn().mockReturnValue('foobar');
			const clearTimeout = jest.fn();
			const poller = new Poller({
				setTimeout,
				clearTimeout,
				pollFunction: getSinglePollFunction(),
			});
			poller.end();
			expect(clearTimeout).not.toHaveBeenCalled();
		});
	});
});
