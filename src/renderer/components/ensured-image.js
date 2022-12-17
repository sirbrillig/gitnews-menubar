import React from 'react'
import PropTypes from 'prop-types';

const secsToMs = ( secs ) => secs * 1000;

const el = React.createElement;

class EnsuredImage extends React.Component {
	constructor( props ) {
		super( props );
		this.state = { didLoadFail: false };
		this.handleFailedImage = this.handleFailedImage.bind( this );
		this.retryImage = this.retryImage.bind( this );
	}

	retryImage() {
		this.setState( { didLoadFail: false } );
	}

	handleFailedImage( retryAfter ) {
		this.setState( { didLoadFail: true } );
		this.props.setTimeout( this.retryImage, retryAfter );
		this.props.onError && this.props.onError();
	}

	render() {
		const { src, retryAfter, className, onClick, alt, id, sizes, srcSet, title } = this.props;
		if ( this.state.didLoadFail ) {
			return el( this.props.PlaceholderComponent );
		}
		const onError = () => this.handleFailedImage( retryAfter );
		return el( this.props.ImageComponent, { src, onError, className, onClick, alt, id, sizes, srcSet, title } );
	}
}

EnsuredImage.propTypes = {
	// img props
	src: PropTypes.string.isRequired,
	className: PropTypes.string,
	onClick: PropTypes.func,
	onError: PropTypes.func,
	alt: PropTypes.string,
	id: PropTypes.string,
	sizes: PropTypes.string,
	srcSet: PropTypes.string,
	title: PropTypes.string,
	// Special props
	retryAfter: PropTypes.number,
	setTimeout: PropTypes.func,
	ImageComponent: PropTypes.func,
	PlaceholderComponent: PropTypes.func,
};

EnsuredImage.defaultProps = {
	retryAfter: secsToMs( 60 ),
	setTimeout: ( callBack, timeUntil ) => setTimeout( callBack, timeUntil ),
	ImageComponent,
	PlaceholderComponent,
};

function ImageComponent( { src, onError, className, onClick, alt, id, sizes, srcSet, title } ) {
	return el( 'img', {
		className,
		src,
		onError,
		onClick,
		alt,
		id,
		sizes,
		srcSet,
		title
	} );
}

function PlaceholderComponent() {
	return el(
		'svg',
		{ width: '33', height: '33' },
		el( 'circle', { cx: '16', cy: '16', r: '15', fill: 'orange' } )
	);
}

export default EnsuredImage;
