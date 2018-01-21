#!/usr/bin/env node
'use strict'

const mri = require('mri')

const pkg = require('./package.json')

const play = require('.')

const showError = (err) => {
	console.error(err)
	process.exit(1)
}

const argv = mri(process.argv.slice(2), {
	boolean: [
		'help', 'h',
		'version', 'v'
	]
})

if (argv.h || argv.help) {
	process.stdout.write(`\
${pkg.description}

Usage:
	play-on-apple-tv <audio-url> <apple-tv-address>
`)
	process.exit(0)
}

if (argv.v || argv.version) {
	process.stdout.write('coup-play ' + pkg.version + '\n')
	process.exit(0)
}

const audioUrl = argv._[0]
if (!audioUrl) showError('Missing audio-url argument.')
const appleTvAddress = argv._[1]
if (!appleTvAddress) showError('Missing apple-tv-address argument.')

const device = play(audioUrl, appleTvAddress, (err) => {
	if (err) showError(err)
})
device.on('error', showError)

process.once('beforeExit', () => {
	device.stop()
})
