/* globals describe, it */
const { doesTextMentionUser } = require('../src/main/lib/mentions');

describe('doesTextMentionUser()', function () {
	it('returns true if the text mentions the user', function () {
		expect(
			doesTextMentionUser('Hey @sirbrillig can you look?', 'sirbrillig')
		).toBe(true);
	});

	it('returns true for a mention at the start of the text', function () {
		expect(doesTextMentionUser('@sirbrillig thoughts?', 'sirbrillig')).toBe(
			true
		);
	});

	it('ignores case', function () {
		expect(doesTextMentionUser('cc @SirBrillig', 'sirbrillig')).toBe(true);
	});

	it('returns true for a mention followed by punctuation', function () {
		expect(doesTextMentionUser('Thanks, @sirbrillig!', 'sirbrillig')).toBe(
			true
		);
	});

	it('returns false if the text does not mention the user', function () {
		expect(doesTextMentionUser('Looks good to me', 'sirbrillig')).toBe(false);
	});

	it('returns false for a longer login with the same prefix', function () {
		expect(doesTextMentionUser('cc @sirbrillig-bot', 'sirbrillig')).toBe(false);
	});

	it('returns false for an email address', function () {
		expect(doesTextMentionUser('mail me@sirbrillig.com', 'sirbrillig')).toBe(
			false
		);
	});

	it('returns false for a team mention', function () {
		expect(doesTextMentionUser('cc @sirbrillig/team', 'sirbrillig')).toBe(
			false
		);
	});

	it('returns false for a mention in inline code', function () {
		expect(doesTextMentionUser('Run `ping @sirbrillig`', 'sirbrillig')).toBe(
			false
		);
	});

	it('returns false for a mention in a fenced code block', function () {
		const body = 'Example:\n```\n@sirbrillig\n```\nDone';
		expect(doesTextMentionUser(body, 'sirbrillig')).toBe(false);
	});

	it('returns false for a mention in a quote', function () {
		const body = '> @sirbrillig can you look?\n\nI agree';
		expect(doesTextMentionUser(body, 'sirbrillig')).toBe(false);
	});

	it('returns false if the body or login is missing', function () {
		expect(doesTextMentionUser(null, 'sirbrillig')).toBe(false);
		expect(doesTextMentionUser('@sirbrillig', undefined)).toBe(false);
	});
});
