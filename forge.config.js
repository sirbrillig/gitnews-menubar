module.exports = {
	packagerConfig: {
		icon: './static/images/gitnews-menubar',
	},
	plugins: [
		{
			name: '@electron-forge/plugin-webpack',
			config: {
				port: 8000,
				devContentSecurityPolicy: `default-src 'self' *.github.com *.githubusercontent.com localhost:3000 'unsafe-eval' 'unsafe-inline'`,
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
