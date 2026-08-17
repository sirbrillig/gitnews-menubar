import React from 'react';
import { flushSync } from 'react-dom';

// How far outside the viewport an element can be and still be given a
// view-transition-name, so rows just past the edge still animate into place.
const nearViewportMargin = '300px';

export function runWithViewTransition(update: () => void) {
	const doc = document as Document & {
		startViewTransition?: (cb: () => void) => unknown;
	};
	if (typeof doc.startViewTransition === 'function') {
		doc.startViewTransition(() => flushSync(update));
		return;
	}
	update();
}

/**
 * Returns a ref to attach to an element and a view-transition-name which is
 * only set while that element is at or near the viewport.
 *
 * Starting a view transition snapshots every element in the document that has a
 * view-transition-name, twice, on the main thread, and the page cannot be
 * scrolled or clicked until it finishes. Naming every row of a list which can
 * hold hundreds of notifications makes that take seconds, so only name the
 * handful of rows the user could actually watch animate.
 */
export function useVisibleViewTransitionName(name: string): {
	ref: React.RefObject<HTMLDivElement>;
	viewTransitionName: string | undefined;
} {
	const ref = React.useRef<HTMLDivElement>(null);
	const [isNearViewport, setIsNearViewport] = React.useState(false);

	React.useEffect(() => {
		const element = ref.current;
		if (!element || typeof IntersectionObserver !== 'function') {
			// Without an observer, name the element so it still animates.
			setIsNearViewport(true);
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				setIsNearViewport(entries.some((entry) => entry.isIntersecting));
			},
			{ rootMargin: nearViewportMargin }
		);
		observer.observe(element);
		return () => observer.disconnect();
	}, []);

	return { ref, viewTransitionName: isNearViewport ? name : undefined };
}
