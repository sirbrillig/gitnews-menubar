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
			<div className="config-section">
				<div className="config-section__header">
					<div className="config-section__label">Accounts</div>
					<div className="config-section__actions">
						{hasSelectedAccountBeenDeleted && selectedAccount && (
							<button
								className="add-account-button config-section__action-button"
								onClick={() => {
									dispatch(setAccounts([selectedAccount, ...accounts]));
								}}
							>
								Restore &lsquo;{selectedAccount.name}&rsquo;
							</button>
						)}
						<button
							className="add-account-button config-section__action-button"
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
							+ New
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
								<div className="account-list__info">
									<span className="account-list__name">{account.name ?? 'Unnamed'}</span>
									<span className="account-list__url">{account.serverUrl}</span>
								</div>
							</li>
						);
					})}
				</ul>
			</div>
		</div>
	);
}
