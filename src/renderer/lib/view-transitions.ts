import { flushSync } from 'react-dom';

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
