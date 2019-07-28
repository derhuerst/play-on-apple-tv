'use strict'

const AirPlay = require('airplay-protocol')

const play = (mediaUrl, address, cb) => {
	const device = new AirPlay(address)
	device.play(mediaUrl, cb)

	return device
}

module.exports = play
