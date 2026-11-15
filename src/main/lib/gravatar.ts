import { createHash } from 'crypto';

/**
 * Return the Gravatar URL for an email address, or undefined if there is no
 * usable email.
 *
 * The URL uses `d=404` so that a missing Gravatar fails to load rather than
 * showing Gravatar's default image, letting the app fall back to its own
 * generated avatar.
 */
export function getGravatarUrl(
	email: string | null | undefined
): string | undefined {
	const normalized = email?.trim().toLowerCase();
	if (!normalized || !normalized.includes('@')) {
		return undefined;
	}
	const hash = createHash('sha256').update(normalized).digest('hex');
	return `https://gravatar.com/avatar/${hash}?s=80&d=404`;
}
