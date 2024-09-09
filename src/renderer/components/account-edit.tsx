import React from 'react';
import { AccountInfo, AppReduxState } from '../types';
import { useDispatch } from 'react-redux';
import { setAccounts } from '../lib/reducer';
import { useSelector } from 'react-redux';

export default function AccountEdit({
	account,
	showAccounts,
}: {
	account: AccountInfo;
	showAccounts: () => void;
}) {
	const [tempAccount, setTempAccount] = React.useState<AccountInfo>(account);
	const accounts = useSelector((state: AppReduxState) => state.accounts);
	const otherAccounts = accounts.filter((acc) => acc.id !== account.id);
	const dispatch = useDispatch();

	return (
		<div className="config-page">
			<h2 className="config-page__title">Edit Account</h2>
			<div className="account-page-actions">
				<button
					className="btn"
					onClick={() => {
						dispatch(setAccounts(otherAccounts));
						showAccounts();
					}}
				>
					Delete
				</button>
				<div>
					<button
						className="btn"
						onClick={() => {
							showAccounts();
						}}
					>
						Cancel
					</button>
					<button
						className="btn"
						onClick={() => {
							dispatch(setAccounts([tempAccount, ...otherAccounts]));
							showAccounts();
						}}
					>
						Save
					</button>
				</div>
			</div>
			<div className="edit-account-form">
				<div>
					<label htmlFor="add-token-form__input">Name:</label>
					<input
						type="text"
						className="add-token-form__input"
						id="add-token-form__input"
						value={tempAccount.name}
						onChange={(event) => {
							setTempAccount({
								...tempAccount,
								name: event.target.value,
							});
						}}
					/>
				</div>
				<div>
					<label htmlFor="add-token-form__input">Server URL:</label>
					<input
						type="text"
						className="add-token-form__input"
						id="add-token-form__input"
						value={tempAccount.serverUrl}
						onChange={(event) => {
							setTempAccount({
								...tempAccount,
								serverUrl: event.target.value,
							});
						}}
					/>
				</div>
				<div>
					<p>
						You must generate a GitHub authentication token so this app can see
						your notifications. It will need the `notifications` and `repo`
						scopes.
					</p>
					<label htmlFor="add-token-form__input">GitHub Token:</label>
					<input
						type="text"
						className="add-token-form__input"
						id="add-token-form__input"
						value={tempAccount.apiKey}
						onChange={(event) => {
							setTempAccount({
								...tempAccount,
								apiKey: event.target.value,
							});
						}}
					/>
				</div>
				<div>
					<label htmlFor="add-token-form__input">(Optional) Proxy:</label>
					<input
						type="text"
						className="add-token-form__input"
						id="add-token-form__input"
						value={tempAccount.proxyUrl}
						onChange={(event) => {
							setTempAccount({
								...tempAccount,
								proxyUrl: event.target.value,
							});
						}}
					/>
				</div>
			</div>
		</div>
	);
}
