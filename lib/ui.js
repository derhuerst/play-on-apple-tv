'use strict'

const renderBytes = require('pretty-bytes')
const renderMs = require('pretty-ms')
const ansiDiffStream = require('ansi-diff-stream')
const listenForKeys = require('@derhuerst/cli-on-key')
const esc = require('ansi-escapes')
const chalk = require('chalk')

const REFRESH_INTERVAL = 2000

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

	const scrubTo = (newPosition) => {
		// todo: anticipate result
		// const onScrub = () => {
		// 	params.position = newPosition
		// 	render()
		// }
		device.scrub(newPosition)
	}

	const onKey = (key) => {
		if (
			key.name === 'escape' ||
			(key.ctrl && (key.name === 'c' || key.name === 'd'))
		) return stop()
		// todo: queue input until ready?
		if (!params.readyToPlay) return beep()

		if (key.name === 'space') {
			// todo: anticipate result
			// const onPause = () => {
			// 	params.rate = 0
			// 	render()
			// }
			if (state === 'playing') device.pause()
			else device.resume()
			return
		}

		// todo: allow faster double-scrub
		// const scrubStep = Math.sqrt(params.duration / 5)
		const scrubStep = 5
		if (key.name === 'left') {
			if (params.position === 0) return beep()
			return scrubTo(Math.max(params.position - scrubStep, 0))
		}
		if (key.name === 'right') {
			const {duration} = params
			const dur = 'number' === typeof duration ? duration : Infinity
			if (params.position === dur) return beep()
			return scrubTo(Math.min(params.position + scrubStep, dur))
		}

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
		device.close()
	}

	const stopListeningForKeys = listenForKeys(process.stdin, onKey)
	setImmediate(fetchInfo)
	setImmediate(render)
	// todo: hide cursor?
}

module.exports = showUI
