import Gio from 'gi://Gio'

import { LOG_PREFIX } from '../constants.js'


try {
	// eslint-disable-next-line no-underscore-dangle
	Gio._promisify(Gio.File.prototype, 'load_contents_async', 'load_contents_finish')
} catch (e) {
	logError(e)
}

/** @typedef {{ active: number, total: number }} CpuData */

/**
 * @param {string} line
 * @returns {CpuData}
 */
function parseCpuLine(line) {
	const values = line.trim().split(/[\s]+/).slice(1)

	// see `man proc`
	const [
		user,
		nice,
		system,
		idle,
		iowait,
		irq, // eslint-disable-line
		softirq,
		steal,
		guest, // eslint-disable-line
		guestNice, // eslint-disable-line
	] = values.map(n => parseInt(n, 10))

	return {
		active: user + system + nice + softirq + steal,
		total: user + system + nice + softirq + steal + idle + iowait,
	}
}

/**
 * @param {string} contents
 *
 * @returns {{ system: CpuData, specific: CpuData[] }}
 */
function parseProcStatContents(contents) {
	const [cpu, ...cpuN] = contents
		.split('\n')
		.filter(line => line.startsWith('cpu'))

	return {
		system: parseCpuLine(cpu),
		specific: cpuN.map(parseCpuLine),
	}

}

export default async function* () {
	const procStatFile = Gio.File.new_for_path('/proc/stat')

	let prevActive = 0
	let prevTotal = 0

	while (true) {
		const [bytes] = await procStatFile.load_contents_async(null)
		const contents = new TextDecoder('utf-8').decode(bytes)

		const { active, total } = parseProcStatContents(contents).system

		let utilization = 100 * ((active - prevActive) / (total - prevTotal))
		if (Number.isNaN(utilization) || !Number.isFinite(utilization)) {
			const data = JSON.stringify({ total, active, prevTotal, prevActive })
			log(`${LOG_PREFIX}: cpu utilization is ${utilization}, data: ${data}`)

			utilization = 0
		}

		if (utilization > 100) {
			const data = JSON.stringify({ total, active, prevTotal, prevActive })
			log(`${LOG_PREFIX}: cpu utilization is ${utilization}, data: ${data}`)

			utilization = 100
		}

		prevActive = active
		prevTotal = total

		yield utilization
	}
}
