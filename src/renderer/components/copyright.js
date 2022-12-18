import React from 'react';

export default function Copyright({ openUrl, getVersion }) {
	const openLink = event => {
		event.preventDefault();
		openUrl(event.target.href);
	};

	const [version, setVersion] = React.useState();
	React.useEffect(() => {
		getVersion().then(setVersion);
	}, [getVersion]);

	if (!version) {
		return null;
	}

	return (
		<div className="copyright">
			<div className="copyright__text">
				<a
					href="https://github.com/sirbrillig/gitnews-menubar"
					onClick={openLink}>
					gitnews-menubar
				</a>{' '}
				- <span>v{version}</span> - <span>copyright 2022 Payton Swick</span>
			</div>
		</div>
	);
}
