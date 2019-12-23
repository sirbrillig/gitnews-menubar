import React from 'react';

export default function Copyright({ openUrl, version }) {
	const openLink = event => {
		event.preventDefault();
		openUrl(event.target.href);
	};
	return (
		<div className="copyright">
			<div className="copyright__text">
				<a
					href="https://github.com/sirbrillig/gitnews-menubar"
					onClick={openLink}>
					gitnews-menubar
				</a>{' '}
				- <span>v{version}</span> - <span>copyright 2017 Payton Swick</span>
			</div>
		</div>
	);
}
