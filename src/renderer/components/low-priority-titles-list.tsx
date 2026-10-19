import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
	setLowPriorityCommentPatterns,
	setLowPriorityTitlePatterns,
} from '../lib/reducer';
import { compileTitlePattern } from '../lib/helpers';
import { AppReduxState } from '../types';

type PatternKind = 'title' | 'comment';

const patternKindLabels: Record<PatternKind, string> = {
	title: 'Title',
	comment: 'Comment',
};

export default function LowPriorityTitlesList() {
	const dispatch = useDispatch();
	const titlePatterns = useSelector(
		(state: AppReduxState) => state.lowPriorityTitlePatterns ?? {}
	);
	const commentPatterns = useSelector(
		(state: AppReduxState) => state.lowPriorityCommentPatterns ?? {}
	);
	const patternsByKind: Record<PatternKind, Record<string, string[]>> = {
		title: titlePatterns,
		comment: commentPatterns,
	};
	const notes = useSelector((state: AppReduxState) => state.notes);
	const knownRepos = React.useMemo(
		() =>
			Array.from(new Set(notes.map((note) => note.repositoryFullName))).sort(),
		[notes]
	);
	const repos = Array.from(
		new Set([...Object.keys(titlePatterns), ...Object.keys(commentPatterns)])
	).sort();

	const setPatterns = (kind: PatternKind, repo: string, patterns: string[]) =>
		dispatch(
			kind === 'title'
				? setLowPriorityTitlePatterns(repo, patterns)
				: setLowPriorityCommentPatterns(repo, patterns)
		);
	const addPattern = (kind: PatternKind, repo: string, pattern: string) => {
		const existing = patternsByKind[kind][repo.trim().toLowerCase()] ?? [];
		if (existing.includes(pattern)) {
			return;
		}
		setPatterns(kind, repo, [...existing, pattern]);
	};

	return (
		<div className="config-page">
			<div className="config-section">
				<div className="config-section__label">Low Priority Patterns</div>
				<p className="muted-repos-list__description">
					Unread notes whose title or latest comment matches one of a
					repo&apos;s regular expressions are shown lower in the list and do not
					trigger the unseen icon, unless they mention you. Comment patterns
					match the plain text of the latest comment or review, so a note stops
					being low priority when a comment that does not match is added.
					Matching ignores case.
				</p>
				<AddPatternForm knownRepos={knownRepos} addPattern={addPattern} />
				{repos.length === 0 ? (
					<div className="muted-repos-list__empty">No patterns.</div>
				) : (
					<ul className="muted-repos-list__repos">
						{repos.map((repo) => (
							<li key={repo} className="low-priority-titles__repo">
								<span className="muted-repos-list__repo-name">{repo}</span>
								<ul className="low-priority-titles__patterns">
									{(['title', 'comment'] as const).flatMap((kind) =>
										(patternsByKind[kind][repo] ?? []).map((pattern) => (
											<li key={`${kind}:${pattern}`}>
												<span className="low-priority-titles__pattern-row">
													<span className="low-priority-titles__kind">
														{patternKindLabels[kind]}
													</span>
													<code
														className={
															compileTitlePattern(pattern)
																? 'low-priority-titles__pattern'
																: 'low-priority-titles__pattern low-priority-titles__pattern--invalid'
														}
													>
														{pattern}
													</code>
												</span>
												<button
													className="muted-repos-list__unmute-button"
													aria-label={`Remove ${kind} pattern ${pattern} for ${repo}`}
													onClick={() =>
														setPatterns(
															kind,
															repo,
															(patternsByKind[kind][repo] ?? []).filter(
																(item) => item !== pattern
															)
														)
													}
												>
													Remove
												</button>
											</li>
										))
									)}
								</ul>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}

function AddPatternForm({
	knownRepos,
	addPattern,
}: {
	knownRepos: string[];
	addPattern: (kind: PatternKind, repo: string, pattern: string) => void;
}) {
	const [kind, setKind] = React.useState<PatternKind>('title');
	const [repo, setRepo] = React.useState('');
	const [pattern, setPattern] = React.useState('');
	const isRepoValid = /^[^/\s]+\/[^/\s]+$/.test(repo.trim());
	const isPatternValid =
		pattern.trim() !== '' && compileTitlePattern(pattern) !== null;
	const error = (() => {
		if (pattern.trim() !== '' && !isPatternValid) {
			return 'That is not a valid regular expression.';
		}
		return undefined;
	})();

	const onSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		if (!isRepoValid || !isPatternValid) {
			return;
		}
		addPattern(kind, repo.trim(), pattern);
		setPattern('');
	};

	return (
		<form className="low-priority-titles__form" onSubmit={onSubmit}>
			<label htmlFor="low-priority-titles__repo">Repo (owner/name)</label>
			<input
				type="text"
				className="add-token-form__input"
				id="low-priority-titles__repo"
				list="low-priority-titles__known-repos"
				placeholder="owner/repo"
				value={repo}
				onChange={(event) => setRepo(event.target.value)}
			/>
			<datalist id="low-priority-titles__known-repos">
				{knownRepos.map((knownRepo) => (
					<option key={knownRepo} value={knownRepo} />
				))}
			</datalist>
			<label htmlFor="low-priority-titles__kind">Match</label>
			<select
				id="low-priority-titles__kind"
				value={kind}
				onChange={(event) => setKind(event.target.value as PatternKind)}
			>
				<option value="title">Title</option>
				<option value="comment">Latest comment</option>
			</select>
			<label htmlFor="low-priority-titles__pattern">
				{kind === 'title' ? 'Title pattern' : 'Comment pattern'}
			</label>
			<input
				type="text"
				className="add-token-form__input"
				id="low-priority-titles__pattern"
				placeholder={
					kind === 'title'
						? '^(chore|build)\\(deps\\)'
						: '^Code coverage report'
				}
				value={pattern}
				onChange={(event) => setPattern(event.target.value)}
			/>
			{error && <p className="low-priority-titles__error">{error}</p>}
			<button
				type="submit"
				className="btn low-priority-titles__add-button"
				disabled={!isRepoValid || !isPatternValid}
			>
				Add pattern
			</button>
		</form>
	);
}
