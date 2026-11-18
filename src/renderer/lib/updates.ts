import React from 'react';
import type { AppUpdate } from '../types';
import { hoursToMs } from './helpers';

const updateCheckInterval = hoursToMs(4);

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

	// Once a download starts, the notice tracks that version; a later check
	// must not swap it out or hide it.
	const statusRef = React.useRef(status);
	statusRef.current = status;

	React.useEffect(() => {
		const checkForUpdate = () => {
			if (statusRef.current !== 'available') {
				return;
			}
			window.electronApi
				.checkForAppUpdate()
				.then((result) => {
					if (statusRef.current === 'available') {
						setUpdate(result);
					}
				})
				.catch((error) => {
					//eslint-disable-next-line no-console
					console.error(
						`Error fetching updated version: ${(error as Error).message}`
					);
				});
		};
		checkForUpdate();
		const timer = window.setInterval(checkForUpdate, updateCheckInterval);
		return () => window.clearInterval(timer);
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
