module.exports = {
  plugins: [
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        devContentSecurityPolicy: `default-src 'self' *.github.com *.githubusercontent.com localhost:3000 'unsafe-eval' 'unsafe-inline'`,
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [{
            name: 'main_window',
            html: './src/renderer/index.html',
            js: './src/renderer/index.js',
            preload: {
              js: './src/preload.js',
            },
          }],
        }
      }
    }
  ],
  packagerConfig: {},
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
