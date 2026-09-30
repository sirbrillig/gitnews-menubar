/* globals describe, it, expect, beforeEach */
const {
	createMainStorage,
	pickPersistedKeys,
} = require('../src/renderer/lib/main-storage');

const stateKey = 'persist:gitnews-state';

function serialize(state) {
	const raw = {};
	Object.keys(state).forEach((key) => {
		raw[key] = JSON.stringify(state[key]);
	});
	return JSON.stringify(raw);
}

function createMockBridge(initial = {}) {
	const saved = { ...initial };
	return {
		saved,
		getAppStateItem: async (key) => saved[key] ?? null,
		setAppStateItem: async (key, value) => {
			saved[key] = value;
		},
		removeAppStateItem: async (key) => {
			delete saved[key];
		},
		logMessage: () => {},
	};
}

describe('pickPersistedKeys()', function () {
	it('keeps only the requested keys', function () {
		const serialized = serialize({
			mutedRepos: ['a/b'],
			fetchingInProgress: true,
			errors: ['oops'],
		});
		const result = JSON.parse(pickPersistedKeys(serialized, ['mutedRepos']));
		expect(result).toEqual({ mutedRepos: JSON.stringify(['a/b']) });
	});
});

describe('createMainStorage()', function () {
	beforeEach(function () {
		window.localStorage.clear();
	});

	it('returns state saved in the main process', async function () {
		const serialized = serialize({ mutedRepos: ['a/b'] });
		window.electronApi = createMockBridge({ [stateKey]: serialized });
		const storage = createMainStorage(['mutedRepos']);
		expect(await storage.getItem(stateKey)).toEqual(serialized);
	});

	it('prefers main process state over localStorage', async function () {
		const serialized = serialize({ mutedRepos: ['a/b'] });
		window.electronApi = createMockBridge({ [stateKey]: serialized });
		window.localStorage.setItem(stateKey, serialize({ mutedRepos: ['c/d'] }));
		const storage = createMainStorage(['mutedRepos']);
		expect(await storage.getItem(stateKey)).toEqual(serialized);
	});

	it('migrates filtered localStorage state to the main process', async function () {
		const bridge = createMockBridge();
		window.electronApi = bridge;
		window.localStorage.setItem(
			stateKey,
			serialize({ mutedRepos: ['a/b'], fetchingInProgress: true })
		);
		const storage = createMainStorage(['mutedRepos']);
		const expected = serialize({ mutedRepos: ['a/b'] });
		expect(await storage.getItem(stateKey)).toEqual(expected);
		expect(bridge.saved[stateKey]).toEqual(expected);
		expect(window.localStorage.getItem(stateKey)).not.toBeNull();
	});

	it('returns null when nothing is saved anywhere', async function () {
		window.electronApi = createMockBridge();
		const storage = createMainStorage(['mutedRepos']);
		expect(await storage.getItem(stateKey)).toBeNull();
	});

	it('saves and removes items in the main process', async function () {
		const bridge = createMockBridge();
		window.electronApi = bridge;
		const storage = createMainStorage(['mutedRepos']);
		await storage.setItem(stateKey, 'value');
		expect(bridge.saved[stateKey]).toEqual('value');
		await storage.removeItem(stateKey);
		expect(bridge.saved[stateKey]).toBeUndefined();
	});
});
