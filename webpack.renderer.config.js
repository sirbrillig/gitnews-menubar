module.exports = {
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
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
        exclude: /node_modules/
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
    ]
  }
}
