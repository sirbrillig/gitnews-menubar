import React from 'react';
import { AccountInfo } from '../../shared-types';

export function FetchedImage({
	src,
	account,
}: {
	src: string;
	account: AccountInfo;
}) {
	const [imgSrc, setImgSrc] = React.useState<string | undefined>();
	const isFetched = React.useRef<boolean>(false);

	const fetchImage = React.useCallback(async () => {
		const bytes = await window.electronApi.getRawImage(src, account);
		if ('error' in bytes) {
			console.error(`Error loading image ${src}`, bytes.error);
			return;
		}
		const blob = new Blob(bytes);
		const imageObjectURL = URL.createObjectURL(blob);
		setImgSrc(imageObjectURL);
	}, [src]);

	React.useEffect(() => {
		return () => {
			// Make sure to reset isFetched if the component is unmounted.
			isFetched.current = false;
		};
	}, []);

	React.useEffect(() => {
		if (isFetched.current) {
			return;
		}
		isFetched.current = true;
		fetchImage();
	}, [fetchImage]);

	if (!imgSrc) {
		return <PlaceholderComponent />;
	}
	return <img src={imgSrc} />;
}

function PlaceholderComponent() {
	return React.createElement(
		'svg',
		{ width: '33', height: '33' },
		React.createElement('circle', {
			cx: '16',
			cy: '16',
			r: '15',
			fill: 'orange',
		})
	);
}
