import React from 'react';

const secsToMs = (secs: number) => secs * 1000;

const el = React.createElement;

const defaultProps = {
	retryAfter: secsToMs(60),
};

interface EnsuredImageState {
	didLoadFail: boolean;
}

class EnsuredImage extends React.Component<
	EnsuredImageProps,
	EnsuredImageState
> {
	constructor(props: EnsuredImageProps) {
		super(props);
		this.state = { didLoadFail: false };
		this.handleFailedImage = this.handleFailedImage.bind(this);
		this.retryImage = this.retryImage.bind(this);
	}

	retryImage() {
		this.setState({ didLoadFail: false });
	}

	handleFailedImage(retryAfter: number) {
		this.setState({ didLoadFail: true });
		setTimeout(this.retryImage, retryAfter);
		this.props.onError && this.props.onError();
	}

	render() {
		const {
			src,
			retryAfter,
			className,
			onClick,
			alt,
			id,
			sizes,
			srcSet,
			title,
		} = this.props;
		if (this.state.didLoadFail) {
			return el(PlaceholderComponent);
		}
		const onError = () =>
			this.handleFailedImage(retryAfter ?? defaultProps.retryAfter);
		return el(ImageComponent, {
			src,
			onError,
			className,
			onClick,
			alt,
			id,
			sizes,
			srcSet,
			title,
		});
	}
}

export interface EnsuredImageProps {
	// img props
	src: string;
	className?: string;
	onClick?: () => void;
	onError?: () => void;
	alt?: string;
	id?: string;
	sizes?: string;
	srcSet?: string;
	title?: string;
	// Special props
	retryAfter?: number;
}

function ImageComponent({
	src,
	onError,
	className,
	onClick,
	alt,
	id,
	sizes,
	srcSet,
	title,
}: {
	src?: string;
	onError: unknown;
	className?: string;
	onClick?: unknown;
	alt?: string;
	id?: string;
	sizes?: string;
	srcSet?: string;
	title?: string;
}) {
	return el('img', {
		className,
		src,
		onError,
		onClick,
		alt,
		id,
		sizes,
		srcSet,
		title,
	});
}

function PlaceholderComponent() {
	return el(
		'svg',
		{ width: '33', height: '33' },
		el('circle', { cx: '16', cy: '16', r: '15', fill: 'orange' })
	);
}

export default EnsuredImage;
