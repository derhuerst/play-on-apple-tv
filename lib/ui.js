'use strict'

const renderBytes = require('pretty-bytes')
const renderMs = require('pretty-ms')
const ansiDiffStream = require('ansi-diff-stream')
const listenForKeys = require('@derhuerst/cli-on-key')
const esc = require('ansi-escapes')
const chalk = require('chalk')
const {debounce} = require('lodash')

const REFRESH_INTERVAL = 2000

const clamp = (min, max) => val => Math.min(Math.max(val, min), max)

const renderBandwidth = bits => renderBytes(bits / 8) + '/s'
const renderDuration = ms => renderMs(ms * 1000, {secondsDecimalDigits: 0})

const showUI = (device) => {
	const out = ansiDiffStream()
	// const out = process.stdout
	let state = 'loading', error = null
	const params = {}

	const beep = () => {
		process.stdout.write(esc.beep)
	}

	const sendScrub = debounce(device.scrub.bind(device), 200)
	const scrubTo = (newPos) => {
		sendScrub(newPos)
		params.position = newPos // anticipate result
		render()
	}
	const scrubBy = (dT) => {
		const {position, duration} = params
		if ('number' !== typeof position) return beep()
		const dur = 'number' === typeof duration ? duration : Infinity

		const newPos = clamp(0, dur)(position + dT)
		if (Math.round(position) === Math.round(newPos)) return beep()
		scrubTo(newPos)
	}

	const onKey = (key) => {
		if (
			key.name === 'escape' ||
			(key.ctrl && (key.name === 'c' || key.name === 'd'))
		) return stop()

		if (key.name === 'space' || key.name === 'k') {
			if (state === 'playing') device.pause()
			else device.resume()
			return
		}

		if (key.name === 'left') return scrubBy(-5)
		if (key.name === 'right') return scrubBy(5)
		if (key.name === 'j') return scrubBy(-10)
		if (key.name === 'l') return scrubBy(10)

		if (key.ctrl && key.name === 'a') return scrubTo(0)
		if (/^\d$/.test(key.raw)) {
			const {duration} = params
			if ('number' !== typeof duration) return beep()
			return scrubTo(duration * parseInt(key.raw) / 10)
		}

		// todo: activate captions?
		beep()
	}

	const renderStatus = () => {
		const {
			readyToPlay, playbackLikelyToKeepUp, playbackBufferEmpty
		} = params

		if (error) {
			return `😵 ${error.NSLocalizedFailureReason} (${error.code})`
		}

		const icons = Object.assign(Object.create(null), {
			loading: '⋯',
			playing: '▶',
			paused: '⏸',
			stopped: '⏹',
		})
		const stateIcon = icons[state] || state
		const bufferIcon = readyToPlay
			? (playbackLikelyToKeepUp ? '🙂' : '😕')
			: (playbackBufferEmpty ? '😟' :  '🙂')
		return stateIcon + ' ' + bufferIcon
	}

	const render = () => {
		const {
			readyToPlay, playbackLikelyToKeepUp, playbackBufferEmpty,
			rate, position, duration,
			bandwidth, bandwidthMean
		} = params

		const pos = position && renderDuration(position)
		const dur = duration > 0 && renderDuration(duration)
		const bw = (bandwidth || bandwidthMean)
			&& chalk.gray(renderBandwidth(bandwidth || bandwidthMean))

		const ui = [
			renderStatus(),
			dur ? pos + ' / ' + dur : pos,
			bw || null
		]
		out.write(ui.filter(val => val !== null).join(' '))
	}

	device.on('event', (ev) => {
		if ('state' in ev) state = ev.state
		if ('error' in ev) error = ev.error
		if ('params' in ev) Object.assign(params, ev.params)
		render()
	})

	let infoTimeout
	const fetchInfo = () => {
		device.playbackInfo((err, _, info) => {
			if (err) error = err
			else Object.assign(params, info)
			render()
		})
		infoTimeout = setTimeout(fetchInfo, REFRESH_INTERVAL)
	}

	out.pipe(process.stdout)
	const stop = () => {
		out.unpipe(process.stdout)
		stopListeningForKeys()
		clearTimeout(infoTimeout)
		device.destroy()
	}

	const stopListeningForKeys = listenForKeys(process.stdin, onKey)
	setImmediate(fetchInfo)
	setImmediate(render)
	// todo: hide cursor?
}

module.exports = showUI
