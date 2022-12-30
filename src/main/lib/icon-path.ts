import path from 'path';
import debugFactory from 'debug';
import { nativeImage, nativeTheme } from 'electron';

export type IconType = 'normal' | 'unseen' | 'unread' | 'offline' | 'error';

const debug = debugFactory('gitnews-menubar:main');

export function getIconPathBuilder(appDir: string) {
	const imagesDir = './static/images';
	const getIconPathForFilename = (fileName: string) =>
		path.join(appDir, imagesDir, fileName);
	return function getIconPathForState(state: IconType): string {
		switch (state) {
			case 'error':
				return getIconPathForFilename('IconTemplateError.png');
			case 'unseen':
				return nativeTheme.shouldUseDarkColors
					? getIconPathForFilename('IconTemplateAlertDark.png')
					: getIconPathForFilename('IconTemplateAlert.png');
			case 'unread':
				return nativeTheme.shouldUseDarkColors
					? getIconPathForFilename('IconTemplateWarnDark.png')
					: getIconPathForFilename('IconTemplateWarn.png');
			case 'offline':
				return nativeTheme.shouldUseDarkColors
					? getIconPathForFilename('IconTemplateOfflineDark.png')
					: getIconPathForFilename('IconTemplateOffline.png');
		}
		return nativeTheme.shouldUseDarkColors
			? getIconPathForFilename('IconTemplateNormalDark.png')
			: getIconPathForFilename('IconTemplateNormal.png');
	};
}

export function getIconForState(state: IconType) {
	const getIconPathForState = getIconPathBuilder(__dirname);
	const iconPath = getIconPathForState(state);
	debug('icon is', iconPath);
	return nativeImage.createFromPath(iconPath);
}
