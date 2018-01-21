'use strict'

const esc = require('ansi-escapes')
const ansiDiffStream = require('ansi-diff-stream')
const windowSize = require('window-size')
const chalk = require('chalk')
const flattenRanges = require('flatten-overlapping-ranges')

const listenForKeys = require('./listen-for-keys')

const showUI = (device) => {
	const out = ansiDiffStream()
	out.pipe(process.stdout)

	const state = {}

	const beep = () => {
		process.stdout.write(esc.beep)
	}

	const onKey = (key) => {
		if (
			key.name === 'escape' ||
			(key.ctrl && (key.name === 'c' || key.name === 'd'))
		) {
			out.unpipe(process.stdout)
			stopListening()
			process.stdout.write(esc.cursorShow)
			return
		}
		if (!state.readyToPlay) return beep()

		const scrubStep = Math.sqrt(state.duration / 5)

		if (/^\d$/.test(key.raw)) {
			const newPosition = state.duration * parseInt(key.raw) / 10
			device.scrub(newPosition, () => {
				state.position = newPosition
				render()
			})
		} else if (key.name === 'left') {
			if (state.position === 0) return beep()

			const newPosition = state.position - scrubStep
			device.scrub(newPosition, () => {
				state.position = newPosition
				render()
			})
		} else if (key.name === 'right') {
			if (state.position === state.duration) return beep()

			const newPosition = state.position + scrubStep
			device.scrub(newPosition, () => {
				state.position = newPosition
				render()
			})
		} else if (key.name === 'space') {
			if (state.rate === 0) device.resume()
			else {
				device.pause(() => {
					state.rate = 0
					render()
				})
			}
		} else beep()
	}

	const render = () => {
		if (!state.readyToPlay) return out.write('loading')

		const width = windowSize.get().width - 3
		const curPos = Math.round(state.position / state.duration * width)
		const isPlaying = state.rate === 0

		const res = [
			!state.playbackLikelyToKeepUp ? '😢' : '😊',
			' '
		]

		const ranges = []
		if (Array.isArray(state.loadedTimeRanges)) {
			let i = 0
			for (let range of state.loadedTimeRanges) {
				ranges.push([
					'buffering',
					Math.round(range.start / state.duration * width),
					Math.round(range.duration / state.duration * width)
				])
			}
		}
		if (curPos > 0) ranges.push(['played', 0, curPos])
		ranges.push(['cursor', curPos, 1])

		const bars = flattenRanges(ranges)
		for (let [l, states] of bars) {
			if (states.includes('cursor')) {
				res.push(isPlaying ? chalk.red('●') : chalk.green('●'))
			} else if (states.includes('played')) {
				const s = '='.repeat(l)
				res.push(isPlaying ? chalk.red(s) : chalk.green(s))
			} else if (states.includes('buffering')) {
				res.push(chalk.gray('-'.repeat(l)))
			}
		}

		// todo: what is readyToPlayMs?
		out.write(res.join(''))
	}

	device.on('playbackInfo', (playbackInfo) => {
		Object.assign(state, playbackInfo)
		render()
	})

	const stopListening = listenForKeys(process.stdin, onKey)
	device.once('playbackInfo', () => process.stdout.write(esc.cursorHide))
	setImmediate(render)
}

module.exports = showUI
