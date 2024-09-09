import type { AccountInfo } from '../../shared-types';

export const PANE_NOTIFICATIONS = 'notifications-pane';
export const PANE_ACCOUNTS = 'accounts-pane';
export const PANE_ACCOUNT_EDIT = 'account-edit-pane';
export const PANE_CONFIG = 'config-pane';
export const PANE_MUTED_REPOS = 'muted-repos-pane';

export const defaultAccountInfo: AccountInfo = {
	id: 'main-github-api',
	name: 'GitHub',
	serverUrl: 'https://api.github.com',
	apiKey: '',
};
