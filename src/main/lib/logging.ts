import log from 'electron-log';
import debugFactory from 'debug';
import { isLoggingEnabled } from './main-store';

const debug = debugFactory('gitnews-menubar');

// Only use this function for logging!
export function logMessage(
	message: string,
	level: 'info' | 'warn' | 'error'
): void {
	debug(message);
	if (!isLoggingEnabled()) {
		return;
	}
	switch (level) {
		case 'info':
			log.info(message);
			break;
		case 'warn':
			log.warn(message);
			break;
		case 'error':
			log.error(message);
			break;
		default:
			log.error(`Unknown log level '${level}': ${message}`);
	}
}
