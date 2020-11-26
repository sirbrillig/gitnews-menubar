import React from 'react';

export default function MutedReposList({ mutedRepos, unmuteRepo }) {
	return (
		<div className="muted-repos-list">
			<h2>Muted repos</h2>
			<MutedRepos mutedRepos={mutedRepos} unmuteRepo={unmuteRepo} />
		</div>
	);
}

function MutedRepos({ mutedRepos, unmuteRepo }) {
	if (mutedRepos.length === 0) {
		return (
			<div className="muted-repos-list__text">
				There are no muted repos. You can mute a repo by clicking the mute
				button next to a notification for that repo. Notifications from muted
				repos do not change the icon.
			</div>
		);
	}
	return (
		<>
			<div className="muted-repos-list__text">
				These repos are muted. Notifications from muted repos do not change the
				icon. You can unmute repos below.
			</div>
			<ul>
				{mutedRepos.map(repoName => {
					const onClick = () => {
						unmuteRepo(repoName);
					};
					return (
						<li key={repoName}>
							{repoName} <UnmuteRepoButton onClick={onClick} />
						</li>
					);
				})}
			</ul>
		</>
	);
}

function UnmuteRepoButton({ onClick }) {
	return (
		<button aria-label="Unmute notifications from this repo" onClick={onClick}>
			unmute repo
		</button>
	);
}
