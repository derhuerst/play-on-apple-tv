# play-on-apple-tv

**A command line tool to play any audio/video on an [Apple TV](https://en.wikipedia.org/wiki/Apple_TV).**

[![asciicast](https://asciinema.org/a/158258.png)](https://asciinema.org/a/158258)

[![npm version](https://img.shields.io/npm/v/play-on-apple-tv.svg)](https://www.npmjs.com/package/play-on-apple-tv)
[![build status](https://api.travis-ci.org/derhuerst/play-on-apple-tv.svg?branch=master)](https://travis-ci.org/derhuerst/play-on-apple-tv)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/play-on-apple-tv.svg)
[![chat on gitter](https://badges.gitter.im/derhuerst.svg)](https://gitter.im/derhuerst)


## Usage

Using [npx](https://www.npmjs.com/package/npx):

```js
npx play-on-apple-tv 'http://some-server/some-media-file.mp3' 'my-apple-tv.local'
```

Find the address of your Apple TV using this command:

```shell
npx bonjour-browser | grep '_airplay._tcp.local'
```


## Contributing

If you have a question or have difficulties using `play-on-apple-tv`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, refer to [the issues page](https://github.com/derhuerst/play-on-apple-tv/issues).
