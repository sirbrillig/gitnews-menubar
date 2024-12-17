import React from 'react';

// From https://stackoverflow.com/a/16348977/1877316
function getRandomColorForSeed(seed: string): string {
	let hash = 0;
	seed.split('').forEach((char) => {
		hash = char.charCodeAt(0) + ((hash << 5) - hash);
	});
	let colour = '#';
	for (let i = 0; i < 3; i++) {
		const value = (hash >> (i * 8)) & 0xff;
		colour += value.toString(16).padStart(2, '0');
	}
	return colour;
}

// From https://stackoverflow.com/a/39778910/1877316
function generateAvatar(name: string) {
	const initials = name
		.split(' ')
		.map(function (str) {
			return str ? str[0].toUpperCase() : '';
		})
		.join('');
	const canvas = document.createElement('canvas');
	const radius = 30;
	const margin = 5;
	canvas.width = radius * 2 + margin * 2;
	canvas.height = radius * 2 + margin * 2;
	const ctx = canvas.getContext('2d');
	if (!ctx) {
		throw Error('Could not get canvas context to generate avatar');
	}
	ctx.beginPath();
	ctx.arc(radius + margin, radius + margin, radius, 0, 2 * Math.PI, false);
	ctx.closePath();
	ctx.fillStyle = getRandomColorForSeed(name);
	ctx.fill();
	ctx.fillStyle = 'white';
	ctx.font = 'bold 30px Arial';
	ctx.textAlign = 'center';
	ctx.fillText(initials, radius + 5, (radius * 4) / 3 + margin);
	return canvas.toDataURL();
}

export function ImageWithBackup({
	src,
	username,
}: {
	src: string;
	username: string;
}) {
	const [didImageFail, setDidImageFail] = React.useState<boolean>(false);
	const onError = () => {
		setDidImageFail(true);
	};
	if (didImageFail) {
		return <img src={generateAvatar(username)} />;
	}
	return <img src={src} onError={onError} />;
}
