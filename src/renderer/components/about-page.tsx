import React from 'react';
import Copyright from '../components/copyright';
import Attributions from '../components/attributions';
import { OpenUrl } from '../types';

export default function AboutPage({
	openUrl,
	getVersion,
}: {
	openUrl: OpenUrl;
	getVersion: () => Promise<string>;
}) {
	return (
		<div className="config-page">
			<Attributions openUrl={openUrl} />
			<Copyright openUrl={openUrl} getVersion={getVersion} />
		</div>
	);
}
