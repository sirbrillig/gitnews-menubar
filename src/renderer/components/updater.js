import React from 'react';
import { secsToMs } from 'common/lib/helpers';

export default function createUpdater(WrappedComponent) {
	return class Updater extends React.Component {
		constructor(props) {
			super(props);
			this.lastCheckedUpdater = null;
			this.updateInterval = secsToMs(1);
			this.updateTimestamp = this.updateTimestamp.bind(this);
			this.state = { lastUpdated: 0 };
		}

		componentDidMount() {
			if (this.lastCheckedUpdater) {
				window.clearInterval(this.lastCheckedUpdater);
			}
			this.lastCheckedUpdater = window.setInterval(
				() => this.updateTimestamp(),
				this.updateInterval
			);
		}

		componentWillUnmount() {
			if (this.lastCheckedUpdater) {
				window.clearInterval(this.lastCheckedUpdater);
			}
		}

		updateTimestamp() {
			// Just a hack to force re-rendering
			this.setState({ lastUpdated: Date.now() });
		}

		render() {
			const mergedProps = {
				componentLastUpdated: this.state.lastUpdated,
				...this.props,
			};
			return <WrappedComponent {...mergedProps} />;
		}
	};
}
