import React from 'react';
import { AccountInfo, AppReduxState } from '../types';
import { useDispatch } from 'react-redux';
import { selectAccount, setAccounts } from '../lib/reducer';
import { useSelector } from 'react-redux';

export default function AccountList({
	accounts,
	showAccountEdit,
}: {
	accounts: AccountInfo[];
	showAccountEdit: () => void;
}) {
	const dispatch = useDispatch();
	const selectedAccount = useSelector((state: AppReduxState) => state.selectedAccount)
	const hasSelectedAccountBeenDeleted = (() => {
		if (selectedAccount) {
			if (accounts.some(account => account.id === selectedAccount.id)) {
				return false
			}
			return true;
		}
		return false;
	})()

	return (
		<div className="config-page">
			<div className="account-page-header">
				<h2 className="config-page__title">Accounts</h2>
				<div className="account-page-actions">
					{hasSelectedAccountBeenDeleted && selectedAccount && <button
						className="add-account-button btn"
						onClick={() => {
							dispatch(setAccounts([selectedAccount, ...accounts]));
						}}
					>
						Restore '{selectedAccount.name}'
					</button>}
					<button
						className="add-account-button btn"
						onClick={() => {
							const newAccount: AccountInfo = {
								id: crypto.randomUUID(),
								name: '',
								apiKey: '',
								serverUrl: 'https://github.com',
							};
							dispatch(selectAccount(newAccount));
							showAccountEdit();
						}}
					>
						New
					</button>
				</div>
			</div>
			<ul className="account-list">
				{accounts.map((account) => {
					return (
						<li
							key={account.id}
							onClick={() => {
								dispatch(selectAccount(account));
								showAccountEdit();
							}}
						>
							{account.name ?? 'Unnamed'}: {account.serverUrl}
						</li>
					);
				})}
			</ul>
		</div>
	);
}
