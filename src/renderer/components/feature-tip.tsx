import React from 'react';

/**
 * A tip shown inline in the notification list to suggest a setting at a
 * moment when it would help.
 */
export default function FeatureTip({
	children,
	actionLabel,
	dismissLabel,
	onLearnMore,
	onAction,
	onDismiss,
}: {
	children: React.ReactNode;
	/**
	 * Show where the feature is explained, if provided, with a "What's this?"
	 * link.
	 */
	onLearnMore?: () => void;
	actionLabel: string;
	dismissLabel: string;
	onAction: () => void;
	onDismiss: () => void;
}) {
	return (
		// The tip may be inside a clickable element, like a note, so keep clicks
		// from reaching it.
		<div
			className="feature-tip"
			role="status"
			onClick={(event) => event.stopPropagation()}
		>
			{children}{' '}
			{onLearnMore && (
				<>
					<button className="feature-tip__learn-more" onClick={onLearnMore}>
						What&apos;s this?
					</button>
					{' · '}
				</>
			)}
			<button className="feature-tip__action" onClick={onAction}>
				{actionLabel}
			</button>
			{' · '}
			<button className="feature-tip__dismiss" onClick={onDismiss}>
				{dismissLabel}
			</button>
		</div>
	);
}
