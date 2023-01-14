import React from 'react';
import MuteIcon from '../components/mute-icon';
import { OpenUrl } from '../types';

import bellIcon from './bell-icon.png';

export default function Attributions({ openUrl }: { openUrl: OpenUrl }) {
	const openLink = (event: React.MouseEvent<HTMLAnchorElement>) => {
		event.preventDefault();
		openUrl((event.target as HTMLAnchorElement).href);
	};
	return (
		<div className="attributions">
			<h3>Attribution</h3>
			<div className="attributions__text">
				<p>
					<img className="attributions__icon" src={bellIcon} />
					App icons based on images from{' '}
					<a onClick={openLink} href="https://iconoir.com/" title="iconoir">
						Iconoir
					</a>
					&nbsp; (
					<a
						onClick={openLink}
						href="https://github.com/iconoir-icons/iconoir/blob/main/LICENSE"
						title="MIT License"
					>
						MIT
					</a>
					)
				</p>
				<p>
					<MuteIcon className="attributions__icon" />
					Mute icons by{' '}
					<a
						onClick={openLink}
						href="https://www.flaticon.com/authors/freepik"
						title="Freepik"
					>
						Freepik
					</a>{' '}
					from{' '}
					<a onClick={openLink} href="http://www.flaticon.com" title="Flaticon">
						Flaticon
					</a>
					&nbsp; (
					<a
						onClick={openLink}
						href="http://creativecommons.org/licenses/by/3.0/"
						title="Creative Commons BY 3.0"
					>
						CC 3 BY
					</a>
					)
				</p>
			</div>
		</div>
	);
}
