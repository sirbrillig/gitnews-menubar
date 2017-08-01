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
			const setTimeout = sinon.spy();
			const poller = new Poller( { setTimeout } );
			poller.begin();
			expect( setTimeout ).to.have.been.called;
		} );

		it( 'calls pollFunction when pollWhen returns true', function() {
			const pollFunction = sinon.spy();
			const pollWhen = sinon.stub().returns( true );
			const setTimeout = ( callBack ) => callBack();
			const poller = new Poller( { pollFunction, pollWhen, setTimeout } );
			poller.begin();
			expect( pollFunction ).to.have.been.called;
		} );

		it( 'does not call pollFunction when pollWhen returns false', function() {
			const pollFunction = sinon.spy();
			const pollWhen = sinon.stub().returns( false );
			const setTimeout = ( callBack ) => callBack();
			const poller = new Poller( { pollFunction, pollWhen, setTimeout } );
			poller.begin();
			expect( pollFunction ).to.not.have.been.called;
		} );

		it( 'ends a running timer', function() {
			const setTimeout = sinon.stub().returns( 'foobar' );
			const clearTimeout = sinon.spy();
			const poller = new Poller( { setTimeout, clearTimeout } );
			poller.begin();
			poller.begin();
			expect( clearTimeout ).to.have.been.calledWith( 'foobar' );
		} );
	} );

	describe( '.end()', function() {
		it( 'ends a running timer', function() {
			const setTimeout = sinon.stub().returns( 'foobar' );
			const clearTimeout = sinon.spy();
			const poller = new Poller( { setTimeout, clearTimeout } );
			poller.begin();
			poller.end();
			expect( clearTimeout ).to.have.been.calledWith( 'foobar' );
		} );

		it( 'has no effect if no timer is running', function() {
			const setTimeout = sinon.stub().returns( 'foobar' );
			const clearTimeout = sinon.spy();
			const poller = new Poller( { setTimeout, clearTimeout } );
			poller.end();
			expect( clearTimeout ).to.not.have.been.called;
		} );
	} );
} );
