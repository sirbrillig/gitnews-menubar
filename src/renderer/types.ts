export interface Note {
	unread: boolean;
	repositoryFullName: string;
	gitnewsMarkedUnread: boolean;
	gitnewsSeen: boolean;
}

export interface AppReduxState {
	token: undefined | string,
	notes: Note[],
	errors: string[],
	mutedRepos: string[],
	fetchingInProgress: boolean,
	lastChecked: false | number,
	lastSuccessfulCheck: false | number,
	fetchingStartedAt: false | number,
	fetchInterval: number,
	fetchRetryCount: number,
	offline: boolean,
	isAutoLoadEnabled: boolean,
	filterType: string, // TODO: let's be more specific
	appVisible: boolean,
}
