/* globals describe, it, expect */
const {
	findWorkflowRunForUpdate,
	normalizeConclusion,
	parseWorkflowRunTitle,
} = require('../src/main/lib/workflow-runs');

const updatedAt = '2026-10-29T15:12:06Z';

function makeRun(overrides = {}) {
	return {
		id: 120363,
		name: 'Secret scan (PR gate)',
		display_title: 'Secret scan gate — Automattic/missioncontrol#165299',
		run_number: 228,
		head_branch: 'update/external-refund-link-reference',
		conclusion: 'cancelled',
		html_url:
			'https://github.a8c.com/Automattic/missioncontrol/actions/runs/120363',
		updated_at: '2026-10-29T15:12:01Z',
		...overrides,
	};
}

describe('parseWorkflowRunTitle', () => {
	it('parses a title with a run name containing spaces and dashes', () => {
		expect(
			parseWorkflowRunTitle(
				'Secret scan gate — Automattic/missioncontrol#165299 workflow run cancelled for update/external-refund-link-reference branch'
			)
		).toEqual({
			name: 'Secret scan gate — Automattic/missioncontrol#165299',
			conclusion: 'cancelled',
			branch: 'update/external-refund-link-reference',
		});
	});

	it('parses a failed run', () => {
		expect(
			parseWorkflowRunTitle('CI workflow run failed for trunk branch')
		).toEqual({ name: 'CI', conclusion: 'failure', branch: 'trunk' });
	});

	it('parses a re-run attempt', () => {
		expect(
			parseWorkflowRunTitle(
				'CI workflow run, Attempt #2 succeeded for trunk branch'
			)
		).toEqual({ name: 'CI', conclusion: 'success', branch: 'trunk' });
	});

	it('returns undefined for other titles', () => {
		expect(parseWorkflowRunTitle('Fix the bug')).toBeUndefined();
	});
});

describe('normalizeConclusion', () => {
	it('maps title and API conclusions to the same values', () => {
		expect(normalizeConclusion('succeeded')).toBe('success');
		expect(normalizeConclusion('success')).toBe('success');
		expect(normalizeConclusion('failed')).toBe('failure');
		expect(normalizeConclusion('timed_out')).toBe('failure');
		expect(normalizeConclusion('canceled')).toBe('cancelled');
		expect(normalizeConclusion('neutral')).toBe('other');
		expect(normalizeConclusion(null)).toBe('other');
	});
});

describe('findWorkflowRunForUpdate', () => {
	const title = parseWorkflowRunTitle(
		'Secret scan gate — Automattic/missioncontrol#165299 workflow run cancelled for update/external-refund-link-reference branch'
	);

	it('finds the run matching the title', () => {
		const run = makeRun();
		expect(findWorkflowRunForUpdate([run], title, updatedAt)).toBe(run);
	});

	it('prefers a run whose name matches over a closer one that does not', () => {
		const named = makeRun({ updated_at: '2026-10-29T15:08:00Z' });
		const other = makeRun({
			id: 2,
			name: 'Tests',
			display_title: 'Tests',
			updated_at: '2026-10-29T15:12:06Z',
		});
		expect(findWorkflowRunForUpdate([other, named], title, updatedAt)).toBe(
			named
		);
	});

	it('picks the run that finished closest to the update', () => {
		const older = makeRun({ id: 1, updated_at: '2026-10-29T15:05:00Z' });
		const closest = makeRun({ id: 2, updated_at: '2026-10-29T15:12:00Z' });
		expect(findWorkflowRunForUpdate([older, closest], title, updatedAt)).toBe(
			closest
		);
	});

	it('prefers a run whose conclusion matches over a later re-run', () => {
		const cancelled = makeRun();
		const rerun = makeRun({
			id: 120367,
			run_number: 229,
			conclusion: 'success',
			updated_at: '2026-10-29T15:12:05Z',
		});
		expect(findWorkflowRunForUpdate([rerun, cancelled], title, updatedAt)).toBe(
			cancelled
		);
	});

	it('falls back to an unnamed run on the branch', () => {
		const run = makeRun({ name: 'Other', display_title: 'Other' });
		expect(findWorkflowRunForUpdate([run], title, updatedAt)).toBe(run);
	});

	it('ignores runs on other branches or long before the update', () => {
		expect(
			findWorkflowRunForUpdate(
				[
					makeRun({ head_branch: 'trunk' }),
					makeRun({ updated_at: '2026-10-29T14:00:00Z' }),
				],
				title,
				updatedAt
			)
		).toBeUndefined();
	});
});
