const React = require( 'react' );
const el = React.createElement;
const { getErrorMessage } = require( '../lib/helpers' );

function ClearErrorsButton( { clearErrors } ) {
	return el( 'button', { className: 'clear-errors-button btn', onClick: clearErrors }, 'Clear Errors' );
}

function ErrorMessage( { error } ) {
	return el( 'div', { className: 'error-message' }, error );
}

function ErrorsArea( { errors, clearErrors } ) {
	return el( 'div', { className: 'errors-area' },
		errors.length > 0 ? el( ClearErrorsButton, { clearErrors } ) : null,
		Object.values( errors.reduce( ( uniqueErrors, error ) => {
			uniqueErrors[ getErrorMessage( error ) ] = error;
			return uniqueErrors;
		}, {} ) ).map( error => el( ErrorMessage, { error, key: getErrorMessage( error ) } ) )
	);
}

module.exports = ErrorsArea;
