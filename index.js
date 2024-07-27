import {URL} from 'node:url'
import {createServer} from 'node:http'
import send from 'send'
import {realpath as pRealpath} from 'node:fs/promises'
import {dirname, basename} from 'node:path'
import getPort from 'get-port'
import internalIp from 'internal-ip'
import AirPlay from 'airplay-protocol'

const noop = () => {}

const isUrl = (url) => {
	try {
		new URL(url)
		return true
	} catch (err) {
		if (err.message.toLowerCase().includes('invalid url')) return false
		throw err
	}
}

const serveFile = (pathToFile, addr, port) => {
	return new Promise((resolve, reject) => {
		const filename = basename(pathToFile)
		const dir = dirname(pathToFile)

		const server = createServer((req, res) => {
			send(req, filename, {root: dir})
			.on('error', noop)
			.pipe(res)
			.on('error', noop)
		})

		server.listen(port, (err) => {
			if (err) return reject(err)

			const fileUrl = new URL(filename, `http://${addr}:${port}`).href
			const stop = server.close.bind(server)
			resolve({fileUrl, stop})
		})
	})
}

const playWithFile = (airplay, pathToFile, cb) => {
	Promise.all([
		pRealpath(pathToFile),
		internalIp.v4(),
		getPort()
	])
	.then(([pathToFile, addr, port]) => {
		return serveFile(pathToFile, addr, port)
	})
	.then(({fileUrl, stop: stopServer}) => {
		const stopBoth = (stopAirplay) => (cb = noop) => {
			stopAirplay((err) => {
				if (err) return cb(err)
				stopServer(cb)
			})
		}
		// This is a race condition: If airplay.destroy has already
		// been called once we've arrived here, we will never stop
		// the HTTP server.
		// todo: fix this race condition
		airplay.destroy = stopBoth(airplay.destroy.bind(airplay))
		airplay.close = stopBoth(airplay.close.bind(airplay))

		airplay.play(fileUrl, (err) => {
			if (err) airplay.destroy(noop)

			if (airplay._rserver) {
				airplay._rserver.once('close', () => stopServer(noop))
			}
			cb(err)
		})
	})
	.catch(cb)
}

const playOnAppleTv = (urlOrFile, address, cb) => {
	const device = new AirPlay(address)

	if (isUrl(urlOrFile)) {
		device.play(urlOrFile, (err) => {
			if (err) device.destroy()
			cb(err)
		})
	} else {
		playWithFile(device, urlOrFile, cb)
	}

	return device
}

export {
	playOnAppleTv,
}
