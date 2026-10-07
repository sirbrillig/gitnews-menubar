const DEFAULT_MAX_LENGTH = 500;

/**
 * Convert a markdown comment body into a short plain-text excerpt suitable
 * for previewing in the notification list.
 *
 * This is intentionally lossy: it only needs to be readable, not faithful.
 * Returns an empty string if there is no meaningful text.
 */
export function getPlainTextExcerpt(
	body: string | undefined | null,
	maxLength: number = DEFAULT_MAX_LENGTH
): string {
	if (!body) {
		return '';
	}
	const text = body
		// HTML comments (common in issue and PR templates).
		.replace(/<!--[\s\S]*?(-->|$)/g, '')
		// Fenced code blocks.
		.replace(/```[\s\S]*?(```|$)/g, ' [code] ')
		.replace(/~~~[\s\S]*?(~~~|$)/g, ' [code] ')
		// Images become their alt text; links become their text.
		.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		// Remaining HTML tags.
		.replace(/<[^>]+>/g, '')
		// Line-leading markers: headings, quotes, list bullets, numbered lists.
		.replace(/^[ \t]*#{1,6}[ \t]+/gm, '')
		.replace(/^[ \t]*(>[ \t]?)+/gm, '')
		.replace(/^[ \t]*[-*+][ \t]+(\[[ xX]\][ \t]+)?/gm, '')
		.replace(/^[ \t]*\d+\.[ \t]+/gm, '')
		// Horizontal rules.
		.replace(/^[ \t]*([-*_][ \t]*){3,}$/gm, '')
		// Emphasis, strikethrough, and inline code markers.
		.replace(/(\*\*|__|~~)(.+?)\1/g, '$2')
		.replace(/(^|\W)[*_](\S(?:.*?\S)?)[*_](?=\W|$)/g, '$1$2')
		.replace(/`([^`\n]*)`/g, '$1')
		// Common HTML entities.
		.replace(/&nbsp;/g, ' ')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&amp;/g, '&')
		.replace(/\s+/g, ' ')
		.trim();

	if (text.length <= maxLength) {
		return text;
	}
	const truncated = text.slice(0, maxLength);
	const lastSpace = truncated.lastIndexOf(' ');
	const cutAt = lastSpace > maxLength * 0.8 ? lastSpace : maxLength;
	return truncated.slice(0, cutAt).trimEnd() + '…';
}
