import React from 'react';
import { AccountInfo } from '../types';
import { useDispatch } from 'react-redux';
import { selectAccount } from '../lib/reducer';

export default function AccountList({
	accounts,
	showAccountEdit,
}: {
	accounts: AccountInfo[];
	showAccountEdit: () => void;
}) {
	const dispatch = useDispatch();
	return (
		<div className="config-page">
			<div className="account-page-header">
				<h2 className="config-page__title">Accounts</h2>
				<div className="account-page-actions">
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
