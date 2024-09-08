import type { AccountInfo } from '../../shared-types';
import type { AppReduxState } from '../types';
import { defaultAccountInfo } from './constants';

export function getAllAccounts(state: AppReduxState): AccountInfo[] {
	// FIXME: This should be a permanent migration to the account system somewhere
	const doesIncludeMainGithubAccount = state.accounts.some(
		(account) => account.serverUrl === defaultAccountInfo.serverUrl
	);
	if (!doesIncludeMainGithubAccount && state.token) {
		return [
			...state.accounts,
			{
				...defaultAccountInfo,
				apiKey: state.token,
			},
		];
	}
	return state.accounts;
}
