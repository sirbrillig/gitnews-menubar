/* globals describe, it */
const chai = require( 'chai' );
const sinon = require( 'sinon' );
const sinonChai = require( 'chai-sinon' );
chai.use( sinonChai );
const { expect } = chai;
const Poller = require( '../src/common/lib/poller' );

function getSinglePollFunction() {
	const pollFunction = sinon.stub();
	pollFunction.onCall( 1 ).returns( false );
	pollFunction.returns( true );
	return pollFunction;
}

describe( 'Poller', function() {
	describe( '.begin()', function() {
		it( 'starts a timer', function() {
			const setTimeout = sinon.spy();
			const poller = new Poller( { setTimeout, pollFunction: getSinglePollFunction() } );
			poller.begin();
			expect( setTimeout ).to.have.been.called;
		} );

		it( 'calls pollFunction immediately', function() {
			const pollFunction = getSinglePollFunction();
			const setTimeout = ( callBack ) => callBack();
			const poller = new Poller( { pollFunction, setTimeout } );
			poller.begin();
			expect( pollFunction ).to.have.been.called;
		} );

		it( 'ends a running timer', function() {
			const setTimeout = sinon.stub().returns( 'foobar' );
			const clearTimeout = sinon.spy();
			const poller = new Poller( { setTimeout, clearTimeout, pollFunction: getSinglePollFunction() } );
			poller.begin();
			poller.begin();
			expect( clearTimeout ).to.have.been.calledWith( 'foobar' );
		} );

		it( 'calls pollFunction multiple times until pollFunction returns false', function() {
			const pollFunction = getSinglePollFunction();
			const setTimeout = ( callBack ) => callBack();
			const poller = new Poller( { pollFunction, setTimeout } );
			poller.begin();
			expect( pollFunction ).to.have.been.calledTwice;
		} );

		it( 'calls pollFunction multiple times until pollFunction throws an error', function() {
			const pollFunction = getSinglePollFunction();
			pollFunction.onCall( 1 ).returns( true );
			pollFunction.onCall( 2 ).throws();
			const setTimeout = ( callBack ) => callBack();
			const poller = new Poller( { pollFunction, setTimeout } );
			let errorThrown = false;
			try {
				poller.begin();
			} catch ( err ) {
				errorThrown = true;
			}
			expect( pollFunction ).to.have.been.calledThrice;
			expect( errorThrown ).to.be.true;
		} );
	} );

	describe( '.end()', function() {
		it( 'ends a running timer', function() {
			const setTimeout = sinon.stub().returns( 'foobar' );
			const clearTimeout = sinon.spy();
			const poller = new Poller( { setTimeout, clearTimeout, pollFunction: getSinglePollFunction() } );
			poller.begin();
			poller.end();
			expect( clearTimeout ).to.have.been.calledWith( 'foobar' );
		} );

		it( 'has no effect if no timer is running', function() {
			const setTimeout = sinon.stub().returns( 'foobar' );
			const clearTimeout = sinon.spy();
			const poller = new Poller( { setTimeout, clearTimeout, pollFunction: getSinglePollFunction() } );
			poller.end();
			expect( clearTimeout ).to.not.have.been.called;
		} );
	} );
} );
