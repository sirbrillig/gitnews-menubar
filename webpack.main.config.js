const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

const assets = ['static'];
const copyPlugins = assets.map(asset => {
	return new CopyPlugin({
		patterns: [
			{
				from: path.resolve(__dirname, asset),
				to: path.resolve(__dirname, '.webpack/main', asset),
			},
		],
	});
});

module.exports = {
	entry: './src/main/index.ts',
	plugins: [...copyPlugins],
	module: {
		rules: [
			{
				// We're specifying native_modules in the test because the asset
				// relocator loader generates a "fake" .node file which is really
				// a cjs file.
				test: /native_modules\/.+\.node$/,
				use: 'node-loader',
			},
			{
				test: /\.(js|jsx|tsx|ts)$/,
				use: 'babel-loader',
				exclude: /node_modules/,
			},
			{
				test: /\.(m?js|node)$/,
				parser: { amd: false },
				use: {
					loader: '@vercel/webpack-asset-relocator-loader',
					options: {
						outputAssetBase: 'native_modules',
					},
				},
			},
			{
				test: /\.(png|svg|jpg|jpeg|gif)$/i,
				type: 'asset/resource',
			},
		],
	},
};
