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
	const [isTokenVisible, setIsTokenVisible] = React.useState(false);
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
					<label htmlFor="edit-account-form__name">Name:</label>
					<input
						type="text"
						className="add-token-form__input"
						id="edit-account-form__name"
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
					<label htmlFor="edit-account-form__server-url">Server URL:</label>
					<input
						type="text"
						className="add-token-form__input"
						id="edit-account-form__server-url"
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
						You must generate a GitHub authentication token ("Personal access
						tokens (classic)") so this app can see your notifications. It will
						need the `notifications` and `repo` scopes.
					</p>
					{tempAccount.isTokenUnreadable && (
						<p className="edit-account-form__notice">
							The saved token could not be read from your macOS Keychain. This
							can happen if Gitnews was denied access to it. Quit and reopen
							Gitnews and choose &ldquo;Always Allow&rdquo; when asked, or enter
							your token again below.
						</p>
					)}
					<label htmlFor="edit-account-form__token">GitHub Token:</label>
					<div className="edit-account-form__token">
						<input
							type={isTokenVisible ? 'text' : 'password'}
							className="add-token-form__input"
							id="edit-account-form__token"
							autoComplete="off"
							spellCheck={false}
							value={tempAccount.apiKey}
							onChange={(event) => {
								setTempAccount({
									...tempAccount,
									apiKey: event.target.value,
									isTokenUnreadable: false,
								});
							}}
						/>
						<button
							className="btn"
							type="button"
							onClick={() => setIsTokenVisible(!isTokenVisible)}
						>
							{isTokenVisible ? 'Hide' : 'Show'}
						</button>
					</div>
				</div>
				<div>
					<label htmlFor="edit-account-form__proxy">(Optional) Proxy:</label>
					<input
						type="text"
						className="add-token-form__input"
						id="edit-account-form__proxy"
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
