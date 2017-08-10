# Gitnews

An app to display GitHub notifications in your menu bar.

<img src="./gitnews-demo.gif" />

## Why not use another app?

This app is much less fully featured than the excellent [Gitify](http://gitify.io/) or [DevSpace](https://devspace.io/). So why use it?

Well, for me, there were two reasons:

1. **Simplicity**: Gitnews does one thing; it tells you if you have any GitHub notifications.
2. **All notifications**: Gitnews will display all your notifications, even for private repositories.

## ✨ Download ✨

Currently the packaged version of Gitnews is only built for Mac OS but the app should work on any platform. If anyone wants to try running it in Windows or Linux I'd be happy to add the build targets.

Visit [the releases page](https://github.com/sirbrillig/gitnews-menubar/releases) for the latest release.

## Attributions

Bell icon made by <a href="http://www.flaticon.com/authors/daniel-bruce">Daniel Bruce</a> from <a href="http://www.flaticon.com">Flaticon</a> (<a href="http://creativecommons.org/licenses/by/3.0/">CC 3.0 BY</a>).

## Development

gitnews-menubar is built using [Electron](https://electron.atom.io/), [React](https://facebook.github.io/react/), and [gitnews](https://github.com/sirbrillig/gitnews).

To run the development version, first install all dependencies by running `yarn` (you must have [yarn](https://yarnpkg.com/en/) installed for this to work).

Next run the command `npm start`.

## Building

To create a packaged Mac OS App, first install dependencies by running `yarn` (you must have [yarn](https://yarnpkg.com/en/) installed for this to work).

Next run the following command: `npm run build`.

You will then find an executable application in the `dist` directory.

To package into a DMG file, run `npm run package`.
