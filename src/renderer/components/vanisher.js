import React from 'react';

export default function Vanisher({ isVisible, children }) {
	const className = isVisible
		? 'vanisher vanisher--visible'
		: 'vanisher vanisher--invisible';
	return <div className={className}>{children}</div>;
}
