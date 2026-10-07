/* globals describe, it */
const { getPlainTextExcerpt } = require('../src/main/lib/excerpt');

describe('getPlainTextExcerpt()', function () {
	it('returns an empty string for missing bodies', function () {
		expect(getPlainTextExcerpt(undefined)).toBe('');
		expect(getPlainTextExcerpt(null)).toBe('');
		expect(getPlainTextExcerpt('')).toBe('');
	});

	it('returns plain text unchanged', function () {
		expect(getPlainTextExcerpt('Looks good to me')).toBe('Looks good to me');
	});

	it('collapses whitespace and newlines', function () {
		expect(getPlainTextExcerpt('First line\n\nSecond   line\n')).toBe(
			'First line Second line'
		);
	});

	it('removes HTML comments', function () {
		expect(
			getPlainTextExcerpt('<!-- Describe your change -->\nFixes the bug')
		).toBe('Fixes the bug');
	});

	it('removes an unterminated HTML comment', function () {
		expect(getPlainTextExcerpt('Fixes it <!-- leftover')).toBe('Fixes it');
	});

	it('replaces fenced code blocks with a placeholder', function () {
		expect(
			getPlainTextExcerpt('Try this:\n```js\nconst a = 1;\n```\nThanks')
		).toBe('Try this: [code] Thanks');
	});

	it('keeps link text and image alt text', function () {
		expect(
			getPlainTextExcerpt(
				'See [the docs](https://example.com) and ![screenshot](https://x.png)'
			)
		).toBe('See the docs and screenshot');
	});

	it('removes HTML tags', function () {
		expect(
			getPlainTextExcerpt('<details><summary>Logs</summary></details>')
		).toBe('Logs');
	});

	it('removes headings, quotes, and list markers', function () {
		expect(
			getPlainTextExcerpt('## Summary\n> quoted\n- one\n* [x] two\n1. three')
		).toBe('Summary quoted one two three');
	});

	it('removes emphasis and inline code markers', function () {
		expect(
			getPlainTextExcerpt('This is **bold**, _italic_, ~~gone~~ and `code`')
		).toBe('This is bold, italic, gone and code');
	});

	it('does not strip underscores inside words', function () {
		expect(getPlainTextExcerpt('call snake_case_name now')).toBe(
			'call snake_case_name now'
		);
	});

	it('decodes common HTML entities', function () {
		expect(getPlainTextExcerpt('a &lt;b&gt; &amp; c')).toBe('a <b> & c');
	});

	it('truncates long text at a word boundary with an ellipsis', function () {
		const body = 'word '.repeat(50);
		const excerpt = getPlainTextExcerpt(body, 22);
		expect(excerpt).toBe('word word word word…');
	});

	it('truncates mid-word when there is no nearby space', function () {
		expect(getPlainTextExcerpt('a'.repeat(30), 10)).toBe('a'.repeat(10) + '…');
	});
});
