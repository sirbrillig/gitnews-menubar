module.exports = {
	presets: [
		[
			'@babel/preset-env',
			{
				targets: {
					// Electron 40 embeds Chromium 144 and Node 24 — both support
					// modern JS natively, so Babel only needs to transpile the
					// small gap between our source and what these versions support.
					chrome: '144',
					node: '24',
				},
			},
		],
		'@babel/preset-react',
		'@babel/preset-typescript',
	],
	plugins: [
		'@babel/plugin-proposal-class-properties',
		[
			'@babel/transform-runtime',
			{
				regenerator: true,
			},
		],
	],
};
