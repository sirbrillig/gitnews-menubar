import React from 'react';
import { AccountInfo } from '../types';

// FIXME: make a better CRUD UX
export default function AccountList({
	goBack,
	accounts,
	setAccounts,
}: {
	goBack: () => void;
	accounts: AccountInfo[];
	setAccounts: (newAccounts: AccountInfo[]) => void;
}) {
	const [editingAccount, setEditingAccount] = React.useState<
		undefined | AccountInfo
	>();
	return (
		<div className="config-page">
			<h2 className="config-page__title">Configuration</h2>
			<h3>Accounts</h3>
			<div className="account-page-actions">
				<button
					className="add-account-button"
					onClick={() => {
						const newAccount: AccountInfo = {
							id: crypto.randomUUID(),
							apiKey: 'UNSET',
							serverUrl: 'https://github.com',
						};
						setAccounts([...accounts, newAccount]);
						setEditingAccount(newAccount);
					}}
				>
					+ Create new account
				</button>
				<button
					disabled={editingAccount === undefined}
					className="add-account-button"
					onClick={() => {
						setAccounts(
							accounts.filter((account) => account.id !== editingAccount?.id)
						);
						setEditingAccount(undefined);
					}}
				>
					- Delete selected account
				</button>
			</div>
			<ul className="account-list">
				{accounts.map((account) => {
					return (
						<li
							key={account.id}
							className={
								editingAccount?.id === account.id ? 'account-list-selected' : ''
							}
							onClick={() => setEditingAccount(account)}
						>
							{account.serverUrl}
						</li>
					);
				})}
			</ul>
			{editingAccount && (
				<div className="edit-account-form">
					<label htmlFor="add-token-form__input">Server URL:</label>
					<input
						type="text"
						className="add-token-form__input"
						id="add-token-form__input"
						value={editingAccount.serverUrl}
						onChange={(event) => {
							const newAccounts = accounts.map((account) => {
								if (account.id === editingAccount.id) {
									account.serverUrl = event.target.value;
								}
								return account;
							});
							setAccounts(newAccounts);
						}}
					/>
					<label htmlFor="add-token-form__input">GitHub Token:</label>
					<input
						type="text"
						className="add-token-form__input"
						id="add-token-form__input"
						value={editingAccount.apiKey}
						onChange={(event) => {
							const newAccounts = accounts.map((account) => {
								if (account.id === editingAccount.id) {
									account.apiKey = event.target.value;
								}
								return account;
							});
							setAccounts(newAccounts);
						}}
					/>
					<label htmlFor="add-token-form__input">(Optional) Proxy:</label>
					<input
						type="text"
						className="add-token-form__input"
						id="add-token-form__input"
						value={editingAccount.proxyUrl}
						onChange={(event) => {
							const newAccounts = accounts.map((account) => {
								if (account.id === editingAccount.id) {
									account.proxyUrl = event.target.value;
								}
								return account;
							});
							setAccounts(newAccounts);
						}}
					/>
				</div>
			)}
			<button
				className="edit-account-form__done btn"
				onClick={goBack}
				aria-label="Done"
			>
				Done
			</button>
		</div>
	);
}
