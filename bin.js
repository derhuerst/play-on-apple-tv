#!/usr/bin/env node
'use strict'

const mri = require('mri')
const pkg = require('./package.json')

const play = require('.')
const showUI = require('./lib/ui')

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
	play-on-apple-tv <path-to-media-file> <apple-tv-address>
	play-on-apple-tv <media-url> <apple-tv-address>
`)
	process.exit(0)
}

if (argv.v || argv.version) {
	process.stdout.write('coup-play ' + pkg.version + '\n')
	process.exit(0)
}

const mediaUrl = argv._[0]
if (!mediaUrl) showError('Missing media-url argument.')
const appleTvAddress = argv._[1]
if (!appleTvAddress) showError('Missing apple-tv-address argument.')

const device = play(mediaUrl, appleTvAddress, (err) => {
	if (err) showError(err)
})
device.on('error', showError)

process.once('beforeExit', () => {
	device.stop()
})

showUI(device)
