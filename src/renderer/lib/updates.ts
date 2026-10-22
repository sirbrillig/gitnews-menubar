import React from 'react';
import type { AppUpdate } from '../types';

export type UpdateStatus = 'available' | 'downloading' | 'ready' | 'failed';

export interface GitnewsUpdateData {
	update: AppUpdate | null;
	status: UpdateStatus;
	downloadUpdate: () => void;
	installUpdate: () => void;
}

export function useGetGitnewsUpdate(): GitnewsUpdateData {
	const [update, setUpdate] = React.useState<AppUpdate | null>(null);
	const [status, setStatus] = React.useState<UpdateStatus>('available');

	React.useEffect(() => {
		window.electronApi
			.checkForAppUpdate()
			.then(setUpdate)
			.catch((error) => {
				//eslint-disable-next-line no-console
				console.error(
					`Error fetching updated version: ${(error as Error).message}`
				);
			});
	}, []);

	const downloadUpdate = React.useCallback(() => {
		setStatus('downloading');
		window.electronApi.downloadAppUpdate().then((result) => {
			if (result?.error) {
				window.electronApi.logMessage(
					`Failed to download update: ${result.error}`,
					'error'
				);
				setStatus('failed');
				return;
			}
			setStatus('ready');
		});
	}, []);

	const installUpdate = React.useCallback(() => {
		window.electronApi.installAppUpdate();
	}, []);

	return { update, status, downloadUpdate, installUpdate };
}
