import type { Storage } from 'redux-persist';

/**
 * Keep only the given top-level keys of a redux-persist serialized state.
 *
 * redux-persist does not apply its whitelist when rehydrating, so state saved
 * before the whitelist existed would otherwise restore every key once.
 */
export function pickPersistedKeys(
	serialized: string,
	keys: readonly string[]
): string {
	const rawState: Record<string, string> = JSON.parse(serialized);
	const picked: Record<string, string> = {};
	for (const key of keys) {
		if (key in rawState) {
			picked[key] = rawState[key];
		}
	}
	return JSON.stringify(picked);
}

function getLegacyItem(key: string): string | null {
	try {
		return window.localStorage.getItem(key);
	} catch {
		return null;
	}
}

/**
 * A redux-persist storage engine that saves state in the main process.
 *
 * If the main process has nothing saved yet, any state previously saved in
 * localStorage is copied over once. The localStorage copy is left in place so
 * that downgrading to an older version still works.
 */
export function createMainStorage(persistedKeys: readonly string[]): Storage {
	return {
		async getItem(key: string): Promise<string | null> {
			const saved = await window.electronApi.getAppStateItem(key);
			if (saved) {
				return saved;
			}
			const legacy = getLegacyItem(key);
			if (!legacy) {
				return null;
			}
			window.electronApi.logMessage(
				`Migrating saved state for ${key} from localStorage`,
				'info'
			);
			let migrated = legacy;
			try {
				migrated = pickPersistedKeys(legacy, persistedKeys);
			} catch (error) {
				window.electronApi.logMessage(
					`Failed to filter saved state during migration: ${error}`,
					'warn'
				);
			}
			await window.electronApi.setAppStateItem(key, migrated);
			return migrated;
		},
		setItem(key: string, value: string): Promise<void> {
			return window.electronApi.setAppStateItem(key, value);
		},
		removeItem(key: string): Promise<void> {
			return window.electronApi.removeAppStateItem(key);
		},
	};
}
