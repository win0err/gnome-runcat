import Gio from 'gi://Gio'
import { LOG_PREFIX } from '../constants.js'


export const MAX_CPU_UTILIZATION = 1.0

type CpuStats = { active: number, total: number }


// eslint-disable-next-line no-underscore-dangle
Gio._promisify(Gio.File.prototype, 'load_contents_async')

let GTop: typeof import('gi://GTop').default | undefined

try {
	({ default: GTop } = await import('gi://GTop'))

	GTop.glibtop_init()
} catch {
	console.error(`${LOG_PREFIX}: GTop is not installed. Falling back to /proc/stat parsing`)
}


export default async function* (): AsyncGenerator<number, number, void> {
	let { active: prevActive, total: prevTotal } = await getCpuStats()

	while (true) {
		const { active, total } = await getCpuStats()

		let utilization = (active - prevActive) / Math.max((total - prevTotal), MAX_CPU_UTILIZATION)

		if (Number.isNaN(utilization) || !Number.isFinite(utilization)) {
			const data = JSON.stringify({ total, active, prevTotal, prevActive })

			console.log(`${LOG_PREFIX}: cpu utilization is ${utilization}, data: ${data}`)

			utilization = 0
		}

		prevActive = active
		prevTotal = total

		yield utilization
	}
}



async function getCpuStats(): Promise<CpuStats> {
	try {
		if (!GTop) {
			return getCpuStatsFallback()
		}

		const cpu = new GTop.glibtop_cpu()

		GTop.glibtop_get_cpu(cpu)

		return {
			active: cpu.user + cpu.sys + cpu.nice,
			total: cpu.total,
		}
	} catch (e) {
		console.error(`${LOG_PREFIX}: ${e}`)

		return { active: 0, total: 0 }
	}
}


async function getCpuStatsFallback(): Promise<CpuStats> {
	const procStatFile = Gio.File.new_for_path('/proc/stat')

	const [bytes] = await procStatFile.load_contents_async(null)
	const contents = new TextDecoder('utf-8').decode(bytes)

	const data = contents
		.split('\n')
		.filter(line => line.startsWith('cpu'))
		.reduce<Record<string, CpuStats>>(
			(acc, line) => {
				const [name, data] = parseCpuLine(line)

				acc[name] = data

				return acc
			},
			{},
		)

	return data['cpu']

}

function parseCpuLine(line: string): [string, CpuStats] {
	const [name, ...values] = line.trim().split(/[\s]+/)

	// see `man proc_stat` and glibtop's `glibtop_get_cpu_s function` in cpu.c
	const [user, nice, sys, idle] = values.map(n => parseInt(n, 10))

	return [
		name,
		{
			active: user + sys + nice,
			total: user + nice + sys + idle,
		},
	]
}
