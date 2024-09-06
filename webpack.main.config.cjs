const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

const assets = ['static'];
const copyPlugins = assets.map((asset) => {
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
	resolve: {
		extensions: ['.js', '.ts'],
	},
	plugins: [...copyPlugins],
	module: {
		rules: [
			{
				test: /\.(js|jsx|tsx|ts)$/,
				use: 'babel-loader',
				exclude: /node_modules/,
			},
		],
	},
};
