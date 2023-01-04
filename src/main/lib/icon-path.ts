import path from 'path';
import debugFactory from 'debug';
import { nativeImage } from 'electron';

export type IconType =
	| 'normal'
	| 'unseen'
	| 'unread'
	| 'offline'
	| 'error'
	| 'loading';

const debug = debugFactory('gitnews-menubar:main');

export function getIconPathBuilder(appDir: string) {
	const imagesDir = './static/images';
	const getIconPathForFilename = (fileName: string) =>
		path.join(appDir, imagesDir, fileName);
	return function getIconPathForState(state: IconType): string {
		switch (state) {
			case 'loading':
				return getIconPathForFilename('BellDisabledTemplate.png');
			case 'error':
				return getIconPathForFilename('BellOfflineTemplate.png');
			case 'unseen':
				return getIconPathForFilename('BellSolidDotTemplate.png');
			case 'unread':
				return getIconPathForFilename('BellOpenDotTemplate.png');
			case 'offline':
				return getIconPathForFilename('BellOfflineTemplate.png');
		}
		return getIconPathForFilename('BellNormalTemplate.png');
	};
}

export function getIconForState(state: IconType) {
	const getIconPathForState = getIconPathBuilder(__dirname);
	const iconPath = getIconPathForState(state);
	debug('icon is', iconPath);
	return nativeImage.createFromPath(iconPath);
}
