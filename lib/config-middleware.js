const { setToken } = require( '../lib/helpers' );

const configMiddleware = store => next => action => { // eslint-disable-line no-unused-vars
	switch ( action.type ) {
		case 'CHANGE_TOKEN':
			setToken( action.token );
	}
	next( action );
};

module.exports = {
	configMiddleware,
};

