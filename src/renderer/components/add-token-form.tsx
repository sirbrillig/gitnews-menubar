import React from 'react';
import { OpenUrl } from '../types';

export default function AddTokenForm({
	token,
	openUrl,
	changeToken,
	showCancel,
	hideEditToken,
}: {
	token: string;
	openUrl: OpenUrl;
	changeToken: (token: string) => void;
	showCancel: boolean;
	hideEditToken: () => void;
}) {
	const openLink = (event: React.MouseEvent<HTMLAnchorElement>) => {
		event.preventDefault();
		openUrl((event.target as HTMLAnchorElement).href);
	};
	let tokenField: { value: string } = null;
	const saveTokenField = (field: { value: string }) => {
		tokenField = field;
	};
	const saveToken = () => {
		if (tokenField) {
			changeToken(tokenField.value);
			hideEditToken();
		}
	};
	return (
		<div className="add-token-form">
			<p>
				You must generate a GitHub authentication token so this app can see your
				notifications. It will need the `notifications` and `repo` scopes. You
				can generate a token{' '}
				<a href="https://github.com/settings/tokens" onClick={openLink}>
					here
				</a>
				.
			</p>
			<label htmlFor="add-token-form__input">GitHub Token:</label>
			<input
				type="text"
				className="add-token-form__input"
				id="add-token-form__input"
				defaultValue={token}
				ref={saveTokenField}
			/>
			{showCancel && (
				<button
					className="add-token-form__cancel-button btn--cancel"
					onClick={hideEditToken}
					aria-label="Cancel changing token"
				>
					Cancel
				</button>
			)}
			<button className="add-token-form__save-button btn" onClick={saveToken}>
				Save Token
			</button>
		</div>
	);
}