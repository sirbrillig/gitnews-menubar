require('dotenv').config();

module.exports = {
	packagerConfig: {
		icon: './static/images/gitnews-menubar',
		arch: 'arm64',
		osxSign: {
			identity: `Developer ID Application: ${process.env.APPLE_IDENTITY}`,
		},
		...(process.env.APPLE_ID && {
			osxNotarize: {
				appleId: process.env.APPLE_ID,
				appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
				teamId: process.env.APPLE_TEAM_ID,
			},
		}),
	},
	plugins: [
		{
			name: '@electron-forge/plugin-webpack',
			config: {
				port: 8000,
				devContentSecurityPolicy: `default-src 'self' *.github.com *.githubusercontent.com localhost:3000 'unsafe-eval' 'unsafe-inline'; img-src 'self' https: blob: data:`,
				mainConfig: './webpack.main.config.js',
				renderer: {
					config: './webpack.renderer.config.js',
					entryPoints: [
						{
							name: 'main_window',
							html: './src/renderer/index.html',
							js: './src/renderer/index.tsx',
							preload: {
								js: './src/preload.ts',
							},
						},
					],
				},
			},
		},
	],
	rebuildConfig: {},
	makers: [
		{
			name: '@electron-forge/maker-squirrel',
			config: {},
		},
		{
			name: '@electron-forge/maker-zip',
			platforms: ['darwin'],
		},
		{
			name: '@electron-forge/maker-deb',
			config: {},
		},
		{
			name: '@electron-forge/maker-rpm',
			config: {},
		},
	],
};
