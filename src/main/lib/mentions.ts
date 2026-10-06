function escapeRegExp(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Remove parts of a markdown comment where a mention would not notify anyone:
 * fenced code blocks, inline code, and quoted lines (which usually repeat an
 * older message).
 */
function stripNonMentionText(body: string): string {
	return body
		.replace(/```[\s\S]*?```/g, '')
		.replace(/~~~[\s\S]*?~~~/g, '')
		.replace(/`[^`\n]*`/g, '')
		.split('\n')
		.filter((line) => !line.trimStart().startsWith('>'))
		.join('\n');
}

/**
 * Return true if the markdown text contains an `@login` mention of the user.
 *
 * Team mentions (`@org/team`) and email addresses do not count.
 */
export function doesTextMentionUser(
	body: string | undefined | null,
	login: string | undefined
): boolean {
	if (!body || !login) {
		return false;
	}
	const mentionPattern = new RegExp(
		`(^|[^\\w/@.-])@${escapeRegExp(login)}(?![\\w/-])`,
		'i'
	);
	return mentionPattern.test(stripNonMentionText(body));
}
