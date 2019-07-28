'use strict'

const AirPlay = require('airplay-protocol')

const play = (mediaUrl, address, cb) => {
	const device = new AirPlay(address)

	const getInfo = () => {
		device.playbackInfo((err, res, playbackInfo) => {
			setTimeout(getInfo, 2000)

			if (err) return device.emit('error', err)
			device.emit('playbackInfo', playbackInfo)
		})
	}

	device.play(mediaUrl, (err) => {
		if (err) return cb(err)

		const waitForPlay = () => {
			device.playbackInfo((err, res, playbackInfo) => {
				if (err) return cb(err)

				device.emit('playbackInfo', playbackInfo)
				if (playbackInfo && playbackInfo.readyToPlay) {
					getInfo()
					cb()
				} else setTimeout(waitForPlay, 500)
			})
		}
		waitForPlay()
	})

	return device
}

module.exports = play
