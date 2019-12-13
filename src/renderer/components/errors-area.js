import React from 'react';
import { getErrorMessage } from 'common/lib/helpers';

function ClearErrorsButton({ clearErrors }) {
	return (
		<button className="clear-errors-button btn" onClick={clearErrors}>
			Clear Errors
		</button>
	);
}

function ErrorMessage({ error }) {
	return <div className="error-message">{error}</div>;
}

function ErrorsArea({ errors, clearErrors }) {
	return (
		<div className="errors-area">
			{errors.length > 0 ? (
				<ClearErrorsButton clearErrors={clearErrors} />
			) : null}
			{Object.values(
				errors.reduce((uniqueErrors, error) => {
					uniqueErrors[getErrorMessage(error)] = error;
					return uniqueErrors;
				}, {})
			).map(error => (
				<ErrorMessage error={error} key={getErrorMessage(error)} />
			))}
		</div>
	);
}

module.exports = ErrorsArea;
