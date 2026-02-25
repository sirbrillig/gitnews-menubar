import React from 'react';
import { AppReduxState } from '../types';

export default function MutedReposList({
	mutedRepos,
	unmuteRepo,
}: {
	mutedRepos: AppReduxState['mutedRepos'];
	unmuteRepo: (note: string) => void;
}) {
	return (
		<div className="config-page">
			<div className="config-section">
				<div className="config-section__label">Muted Repos</div>
				<p className="muted-repos-list__description">
					Notifications from muted repos do not change the icon. Mute a repo
					from the notification list.
				</p>
				<MutedRepos mutedRepos={mutedRepos} unmuteRepo={unmuteRepo} />
			</div>
		</div>
	);
}

function MutedRepos({
	mutedRepos,
	unmuteRepo,
}: {
	mutedRepos: AppReduxState['mutedRepos'];
	unmuteRepo: (note: string) => void;
}) {
	if (mutedRepos.length === 0) {
		return (
			<div className="muted-repos-list__empty">No muted repos.</div>
		);
	}
	return (
		<ul className="muted-repos-list__repos">
			{mutedRepos.map((repoName) => {
				return (
					<li key={repoName}>
						<span className="muted-repos-list__repo-name">{repoName}</span>
						<UnmuteRepoButton onClick={() => unmuteRepo(repoName)} />
					</li>
				);
			})}
		</ul>
	);
}

function UnmuteRepoButton({ onClick }: { onClick: () => void }) {
	return (
		<button
			className="muted-repos-list__unmute-button"
			aria-label="Unmute notifications from this repo"
			onClick={onClick}
		>
			Unmute
		</button>
	);
}
