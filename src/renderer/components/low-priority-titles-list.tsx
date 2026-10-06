import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setLowPriorityTitlePatterns } from '../lib/reducer';
import { compileTitlePattern } from '../lib/helpers';
import { AppReduxState } from '../types';

export default function LowPriorityTitlesList() {
	const dispatch = useDispatch();
	const titlePatterns = useSelector(
		(state: AppReduxState) => state.lowPriorityTitlePatterns ?? {}
	);
	const notes = useSelector((state: AppReduxState) => state.notes);
	const knownRepos = React.useMemo(
		() =>
			Array.from(new Set(notes.map((note) => note.repositoryFullName))).sort(),
		[notes]
	);
	const repos = Object.keys(titlePatterns).sort();

	const setPatterns = (repo: string, patterns: string[]) =>
		dispatch(setLowPriorityTitlePatterns(repo, patterns));
	const addPattern = (repo: string, pattern: string) => {
		const existing = titlePatterns[repo.trim().toLowerCase()] ?? [];
		if (existing.includes(pattern)) {
			return;
		}
		setPatterns(repo, [...existing, pattern]);
	};

	return (
		<div className="config-page">
			<div className="config-section">
				<div className="config-section__label">Low Priority Titles</div>
				<p className="muted-repos-list__description">
					Unread notes whose title matches one of a repo&apos;s regular
					expressions are shown lower in the list and do not trigger the unseen
					icon, unless they mention you. Matching ignores case.
				</p>
				<AddPatternForm knownRepos={knownRepos} addPattern={addPattern} />
				{repos.length === 0 ? (
					<div className="muted-repos-list__empty">No title patterns.</div>
				) : (
					<ul className="muted-repos-list__repos">
						{repos.map((repo) => (
							<li key={repo} className="low-priority-titles__repo">
								<span className="muted-repos-list__repo-name">{repo}</span>
								<ul className="low-priority-titles__patterns">
									{titlePatterns[repo].map((pattern) => (
										<li key={pattern}>
											<code
												className={
													compileTitlePattern(pattern)
														? 'low-priority-titles__pattern'
														: 'low-priority-titles__pattern low-priority-titles__pattern--invalid'
												}
											>
												{pattern}
											</code>
											<button
												className="muted-repos-list__unmute-button"
												aria-label={`Remove pattern ${pattern} for ${repo}`}
												onClick={() =>
													setPatterns(
														repo,
														titlePatterns[repo].filter(
															(item) => item !== pattern
														)
													)
												}
											>
												Remove
											</button>
										</li>
									))}
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
	addPattern: (repo: string, pattern: string) => void;
}) {
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
		addPattern(repo.trim(), pattern);
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
			<label htmlFor="low-priority-titles__pattern">Title pattern</label>
			<input
				type="text"
				className="add-token-form__input"
				id="low-priority-titles__pattern"
				placeholder="^(chore|build)\(deps\)"
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
