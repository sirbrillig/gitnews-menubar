import React from 'react';
import { AccountInfo, AppReduxState, LeaveGuard } from '../types';
import { useDispatch } from 'react-redux';
import { setAccounts } from '../lib/reducer';
import { useSelector } from 'react-redux';

export default function AccountEdit({
	account,
	showAccounts,
	setLeaveGuard,
}: {
	account: AccountInfo;
	showAccounts: () => void;
	setLeaveGuard: (guard: LeaveGuard | null) => void;
}) {
	const [tempAccount, setTempAccount] = React.useState<AccountInfo>(account);
	const [isTokenVisible, setIsTokenVisible] = React.useState(false);
	const accounts = useSelector((state: AppReduxState) => state.accounts);
	const otherAccounts = accounts.filter((acc) => acc.id !== account.id);
	const isNewAccount = otherAccounts.length === accounts.length;
	const hasChanges =
		tempAccount.name !== account.name ||
		tempAccount.serverUrl !== account.serverUrl ||
		tempAccount.apiKey !== account.apiKey ||
		(tempAccount.proxyUrl ?? '') !== (account.proxyUrl ?? '');
	const [isDiscardConfirmVisible, setIsDiscardConfirmVisible] =
		React.useState(false);
	const dispatch = useDispatch();

	// Ask before the back button throws away unsaved changes.
	React.useEffect(() => {
		setLeaveGuard(() => {
			if (!hasChanges) {
				return true;
			}
			setIsDiscardConfirmVisible(true);
			return false;
		});
		return () => setLeaveGuard(null);
	}, [hasChanges, setLeaveGuard]);

	return (
		<div className="config-page">
			<h2 className="config-page__title">
				{isNewAccount ? 'New Account' : 'Edit Account'}
			</h2>
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
			{isDiscardConfirmVisible ? (
				<div className="account-page-actions">
					<span>You have unsaved changes.</span>
					<div className="account-page-actions__group">
						<button
							className="btn--cancel"
							onClick={() => setIsDiscardConfirmVisible(false)}
						>
							Keep Editing
						</button>
						<button className="btn btn--destructive" onClick={showAccounts}>
							Discard
						</button>
					</div>
				</div>
			) : (
				<div className="account-page-actions">
					{isNewAccount ? (
						<span />
					) : (
						<button
							className="btn btn--destructive"
							onClick={() => {
								dispatch(setAccounts(otherAccounts));
								showAccounts();
							}}
						>
							Delete
						</button>
					)}
					<button
						className="btn account-page-actions__save"
						disabled={!hasChanges}
						onClick={() => {
							dispatch(setAccounts([tempAccount, ...otherAccounts]));
							showAccounts();
						}}
					>
						Save
					</button>
				</div>
			)}
		</div>
	);
}
