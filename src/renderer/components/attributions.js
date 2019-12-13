const React = require('react');
const BellIcon = require('../components/bell-icon');

export default function Attributions({ openUrl }) {
	const openLink = event => {
		event.preventDefault();
		openUrl(event.target.href);
	};
	return (
		<div className="attributions">
			<h3>Attribution</h3>
			<div className="attributions__text">
				<BellIcon className="attributions__icon" />
				Bell icon made by&nbsp;
				<a
					onClick={openLink}
					href="http://www.flaticon.com/authors/daniel-bruce"
					title="Daniel Bruce">
					Daniel Bruce
				</a>
				&nbsp; from&nbsp;
				<a onClick={openLink} href="http://www.flaticon.com" title="Flaticon">
					Flaticon
				</a>
				&nbsp; (
				<a
					onClick={openLink}
					href="http://creativecommons.org/licenses/by/3.0/"
					title="Creative Commons BY 3.0">
					CC 3 BY
				</a>
				)
			</div>
		</div>
	);
}
