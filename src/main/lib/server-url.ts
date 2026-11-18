const publicGithubUrls = [
	'https://api.github.com',
	'https://github.com',
	'https://www.github.com',
];

/**
 * Return true if the server URL is for github.com rather than a GitHub
 * Enterprise Server.
 *
 * New accounts default to `https://github.com` but older ones use the API URL,
 * so either is accepted.
 */
export function isPublicGithubServerUrl(
	serverUrl: string | undefined
): boolean {
	if (!serverUrl?.trim()) {
		return true;
	}
	const normalized = serverUrl.trim().replace(/\/+$/, '').toLowerCase();
	return publicGithubUrls.includes(normalized);
}
