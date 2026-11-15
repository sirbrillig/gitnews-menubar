function normalizeDisplayName(name: string | null | undefined): string {
	return (name ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Return true if two display names are present and the same, ignoring case
 * and whitespace.
 *
 * This is used to check that a github.com user with the same login as a
 * GitHub Enterprise Server user is likely the same person.
 */
export function doDisplayNamesMatch(
	first: string | null | undefined,
	second: string | null | undefined
): boolean {
	const normalizedFirst = normalizeDisplayName(first);
	return (
		normalizedFirst !== '' && normalizedFirst === normalizeDisplayName(second)
	);
}
