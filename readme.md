# play-on-apple-tv

**A command line tool to play any audio/video on an [Apple TV](https://en.wikipedia.org/wiki/Apple_TV).**

[![asciicast](https://asciinema.org/a/158258.png)](https://asciinema.org/a/158258)

[![npm version](https://img.shields.io/npm/v/play-on-apple-tv.svg)](https://www.npmjs.com/package/play-on-apple-tv)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/play-on-apple-tv.svg)
[![chat on gitter](https://badges.gitter.im/derhuerst.svg)](https://gitter.im/derhuerst)
[![support me on Patreon](https://img.shields.io/badge/support%20me-on%20patreon-fa7664.svg)](https://patreon.com/derhuerst)


## Usage

Using [`npx`](https://www.npmjs.com/package/npx):

```shell
npx play-on-apple-tv some-audio-file.mp3 my-apple-tv.local
npx play-on-apple-tv 'http://some-server/some-audio-file.mp3' my-apple-tv.local
```

Find the name of your Apple TV using [bonjour-browser](https://www.npmjs.com/package/bonjour-browser):

```shell
npx bonjour-browser | grep airplay
```

Play a Youtube video by finding the raw video url using [`yt-dlp`](https://github.com/yt-dlp/yt-dlp):

```shell
npx play-on-apple-tv $(yt-dlp -f 40 --get-url 'https://www.youtube.com/watch?v=jNQXAC9IVRw') my-apple-tv.local
```


## Contributing

If you have a question or have difficulties using `play-on-apple-tv`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, refer to [the issues page](https://github.com/derhuerst/play-on-apple-tv/issues).
