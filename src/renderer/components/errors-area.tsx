import React from 'react';
import { getErrorMessage } from '../lib/helpers';

function ClearErrorsButton({ clearErrors }: { clearErrors: () => void }) {
	return (
		<button className="clear-errors-button btn" onClick={clearErrors}>
			Clear Errors
		</button>
	);
}

function ErrorMessage({ error }: { error: string }) {
	return <div className="error-message">{error}</div>;
}

export default function ErrorsArea({
	errors,
	clearErrors,
}: {
	errors: string[];
	clearErrors: () => void;
}) {
	return (
		<div className="errors-area">
			{errors.length > 0 ? (
				<ClearErrorsButton clearErrors={clearErrors} />
			) : null}
			{Object.values(
				errors.reduce<Record<string, string>>((uniqueErrors, error) => {
					uniqueErrors[getErrorMessage(error)] = error;
					return uniqueErrors;
				}, {})
			).map(error => (
				<ErrorMessage error={error} key={getErrorMessage(error)} />
			))}
		</div>
	);
}
