/* globals describe, it */
const chai = require( 'chai' );
const sinon = require( 'sinon' );
const sinonChai = require( 'chai-sinon' );
chai.use( sinonChai );
const { expect } = chai;
const { Poller } = require( '../lib/poller' );

describe( 'Poller', function() {
	describe( '.begin()', function() {
		it( 'starts a timer', function() {
			const setInterval = sinon.spy();
			const poller = new Poller( { setInterval } );
			poller.begin();
			expect( setInterval ).to.have.been.called;
		} );

		it( 'calls pollFunction when pollWhen returns true', function() {
			const pollFunction = sinon.spy();
			const pollWhen = sinon.stub().returns( true );
			const setInterval = ( callBack ) => callBack();
			const poller = new Poller( { pollFunction, pollWhen, setInterval } );
			poller.begin();
			expect( pollFunction ).to.have.been.called;
		} );

		it( 'does not call pollFunction when pollWhen returns false', function() {
			const pollFunction = sinon.spy();
			const pollWhen = sinon.stub().returns( false );
			const setInterval = ( callBack ) => callBack();
			const poller = new Poller( { pollFunction, pollWhen, setInterval } );
			poller.begin();
			expect( pollFunction ).to.not.have.been.called;
		} );

		it( 'ends a running timer', function() {
			const setInterval = sinon.stub().returns( 'foobar' );
			const clearInterval = sinon.spy();
			const poller = new Poller( { setInterval, clearInterval } );
			poller.begin();
			poller.begin();
			expect( clearInterval ).to.have.been.calledWith( 'foobar' );
		} );
	} );

	describe( '.end()', function() {
		it( 'ends a running timer', function() {
			const setInterval = sinon.stub().returns( 'foobar' );
			const clearInterval = sinon.spy();
			const poller = new Poller( { setInterval, clearInterval } );
			poller.begin();
			poller.end();
			expect( clearInterval ).to.have.been.calledWith( 'foobar' );
		} );

		it( 'has no effect if no timer is running', function() {
			const setInterval = sinon.stub().returns( 'foobar' );
			const clearInterval = sinon.spy();
			const poller = new Poller( { setInterval, clearInterval } );
			poller.end();
			expect( clearInterval ).to.not.have.been.called;
		} );
	} );
} );