import type { WorkflowRunConclusion } from '../../shared-types';

export interface RawWorkflowRun {
	id?: number;
	name?: string | null;
	display_title?: string | null;
	run_number?: number;
	head_branch?: string | null;
	conclusion?: string | null;
	html_url?: string;
	updated_at?: string;
	actor?: { login?: string; avatar_url?: string } | null;
	triggering_actor?: { login?: string; avatar_url?: string } | null;
}

export interface WorkflowRunTitle {
	/**
	 * The name of the run as shown in the title, which is the workflow's
	 * `run-name` if it has one, or else the workflow's name.
	 */
	name: string;
	conclusion: WorkflowRunConclusion;
	branch: string;
}

// The longest time between a run finishing and its notification being
// updated for the run to be considered the cause.
const MAX_RUN_UPDATE_DELAY_MS = 10 * 60 * 1000;

/**
 * Return the parts of a CheckSuite notification title like `CI workflow run
 * failed for main branch`, or undefined if the title does not match.
 */
export function parseWorkflowRunTitle(
	title: string
): WorkflowRunTitle | undefined {
	const match = title.match(
		/^(.+?) workflow run(?:, Attempt #\d+)? (\S+) for (.+) branch$/
	);
	if (!match) {
		return undefined;
	}
	const [, name, conclusion, branch] = match;
	return { name, conclusion: normalizeConclusion(conclusion), branch };
}

/**
 * Return a conclusion from either a notification title (like `succeeded`) or
 * the API (like `success`).
 */
export function normalizeConclusion(
	conclusion: string | null | undefined
): WorkflowRunConclusion {
	switch (conclusion?.toLowerCase()) {
		case 'succeeded':
		case 'success':
			return 'success';
		case 'failed':
		case 'failure':
		case 'timed_out':
		case 'startup_failure':
			return 'failure';
		case 'cancelled':
		case 'canceled':
			return 'cancelled';
		case 'skipped':
			return 'skipped';
		default:
			return 'other';
	}
}

/**
 * Return the run that caused a CheckSuite notification, or undefined if none
 * of the runs match.
 *
 * Runs on the title's branch are matched by name and conclusion if possible
 * (a re-run can finish moments after the run it replaced), and then the one
 * that finished closest to the notification's update is chosen.
 */
export function findWorkflowRunForUpdate(
	runs: RawWorkflowRun[],
	title: WorkflowRunTitle,
	updatedAt: string
): RawWorkflowRun | undefined {
	const updatedAtMs = Date.parse(updatedAt);
	if (Number.isNaN(updatedAtMs)) {
		return undefined;
	}
	const candidates = runs.filter((run) => {
		if (run.head_branch !== title.branch || !run.html_url) {
			return false;
		}
		const runUpdatedAtMs = Date.parse(run.updated_at ?? '');
		return (
			!Number.isNaN(runUpdatedAtMs) &&
			Math.abs(updatedAtMs - runUpdatedAtMs) <= MAX_RUN_UPDATE_DELAY_MS
		);
	});
	const named = candidates.filter(
		(run) => run.display_title === title.name || run.name === title.name
	);
	const pool = [
		named.filter(
			(run) => normalizeConclusion(run.conclusion) === title.conclusion
		),
		named,
		candidates,
	].find((runs) => runs.length > 0);
	if (!pool) {
		return undefined;
	}
	const distance = (run: RawWorkflowRun) =>
		Math.abs(updatedAtMs - Date.parse(run.updated_at ?? ''));
	return pool.reduce<RawWorkflowRun | undefined>(
		(best, run) => (!best || distance(run) < distance(best) ? run : best),
		undefined
	);
}
