export interface PollerOptions {
	pollFunction: () => boolean;
	setTimeout: typeof window.setTimeout | undefined;
	clearTimeout: typeof window.clearTimeout | undefined;
}

class Poller {
	options: PollerOptions;

	pollRunner: number | null = null;

	constructor(options: Partial<PollerOptions> = {}) {
		const isWindow = typeof window !== 'undefined';

		const defaults: PollerOptions = {
			pollFunction: () => false,
			setTimeout: isWindow ? window.setTimeout.bind(window) : undefined,
			clearTimeout: isWindow ? window.clearTimeout.bind(window) : undefined,
		};

		this.options = Object.assign({}, defaults, options);
		this.pollRunner = null;
	}

	begin() {
		const runPoll = () => {
			this.end();
			if (this.options.pollFunction() && this.options.setTimeout) {
				this.pollRunner = this.options.setTimeout(runPoll, 1000);
			}
		};
		runPoll();
	}

	end() {
		this.pollRunner && this.options.clearTimeout?.(this.pollRunner);
	}
}

export default Poller;
