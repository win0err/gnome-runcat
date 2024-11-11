import GTop from 'gi://GTop'


export const MAX_CPU_UTILIZATION = 1.0

type CpuStats = { active: number, total: number }

function getCpuStats(): CpuStats {
	const cpu = new GTop.glibtop_cpu()
	GTop.glibtop_get_cpu(cpu)

	return {
		active: cpu.user + cpu.sys + cpu.nice,
		total: cpu.total,
	}
}

export default function* (): Generator<number, number, void> {
	let prevActive = 0
	let prevTotal = 0

	while (true) {
		const { active, total } = getCpuStats()
		const utilization = (active - prevActive) / Math.max((total - prevTotal), MAX_CPU_UTILIZATION)

		prevActive = active
		prevTotal = total

		yield utilization
	}
}
