import React from 'react';
import { OpenUrl } from '../types';

export default function Copyright({
	openUrl,
	getVersion,
}: {
	openUrl: OpenUrl;
	getVersion: () => Promise<string>;
}) {
	const openLink = (event: React.MouseEvent<HTMLAnchorElement>) => {
		event.preventDefault();
		openUrl((event.target as HTMLAnchorElement).href);
	};

	const [version, setVersion] = React.useState<string>();
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
					onClick={openLink}
				>
					gitnews-menubar
				</a>{' '}
				- <span>v{version}</span> - <span>copyright 2022 Payton Swick</span>
			</div>
		</div>
	);
}
