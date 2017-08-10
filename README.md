# Gitnews

An app to display GitHub notifications in your menu bar.

<img src="./gitnews-demo.gif" />

## Why not use another app?

This app has fewer features than the excellent [Gitify](http://gitify.io/) or [DevSpace](https://devspace.io/). So why use it?

Well, for me, there were two reasons:

1. **It's simple**: Gitnews does one thing; it tells you if you have any GitHub notifications.
2. **You can see private notifications**: Gitnews will display all your notifications, even for private repositories, because it uses a private token.

## ✨ Download ✨

Currently the packaged version of Gitnews is only built for Mac OS but the app should work on any platform. If anyone wants to try running it in Windows or Linux I'd be happy to add the build targets.

💡 **Note:** I don't have a paid Apple developer account, so the package will warn you that the app is from an "Unidentified developer". The first time you open the app you will need to right-click on it and select "Open" from the context menu. [This Apple support doc](https://support.apple.com/kb/ph18657?locale=en_US) explains how to do this in more detail.

👉 Visit [the releases page](https://github.com/sirbrillig/gitnews-menubar/releases) to download an image of the latest release.

When you run Gitnews, you will need to generate an API key from your GitHub account. The app will guide you through creating one.

## Attributions

<img src="./IconTemplate.png" /> Bell icon made by <a href="http://www.flaticon.com/authors/daniel-bruce">Daniel Bruce</a> from <a href="http://www.flaticon.com">Flaticon</a> (<a href="http://creativecommons.org/licenses/by/3.0/">CC 3.0 BY</a>).

## Development

gitnews-menubar is built using [Electron](https://electron.atom.io/), [React](https://facebook.github.io/react/), and [gitnews](https://github.com/sirbrillig/gitnews).

To run the development version from the source, first install all dependencies by running `yarn` (you must have [yarn](https://yarnpkg.com/en/) installed for this to work). Next run the command `npm start`.

### Building a package

To create a packaged Mac OS App, first install dependencies by running `yarn` (you must have [yarn](https://yarnpkg.com/en/) installed for this to work).

Next run the following command: `npm run build`.

You will then find an executable application in the `dist` directory.

To package the app into a DMG file, run `npm run package`.
