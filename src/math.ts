// Default EMA time constant for the animation cycle duration, ms
export const ANIMATION_SMOOTHING_TAU_MS = 700

// Frame gaps over this are treated as a stall (pause, sleep) and don't advance the animation
export const MAX_FRAME_DELTA_MS = 250


/**
 * Get the duration of a full animation cycle in milliseconds.
 *
 * `f(x)` is the duration of a full animation cycle (for all sprite frames, any count) for the CPU utilization(`x`)
 * `f(x) = d_min + (d_max - d_min)*(1 - x)^k` ms, `x` in `[0; 1]`
 * `f(x) = 250 + 850*(1 - x)^2` ms, with `d_min = 250`, `d_max = 1100`, `k = 2`
 *
 * @param {number} cpuUtilization - CPU utilization in `[0; 1]`
 *
 * @returns {number} duration of a full animation cycle in milliseconds
 **/
export const getAnimationCycleDurationMs = (cpuUtilization: number): number =>
	Math.ceil(250 + 850 * (1 - cpuUtilization) ** 2)

/**
 * Create an animation ticker: turns monotonic-time ticks into sprite frame indices,
 * with EMA-smoothed cycle duration.
 * Stall-safe (time gaps over `MAX_FRAME_DELTA_MS` don't advance the phase);
 * `framesCount` is a `tick` argument, not construction state.
 **/
export const createAnimationTicker = (tauMs = ANIMATION_SMOOTHING_TAU_MS) => {
	let targetDurationMs = 0
	let smoothedDurationMs = 0
	let phase = 0
	let lastTickMs = Number.NaN

	const getSpriteIndex = (phase: number, framesCount: number) => framesCount > 0
		? Math.max(0, Math.floor(phase * framesCount) % framesCount)
		: 0

	return {
		setTargetDuration: (durationMs: number): void => {
			if (!Number.isFinite(durationMs) || durationMs <= 0) {
				return
			}

			targetDurationMs = durationMs

			// first call
			if (smoothedDurationMs <= 0) {
				smoothedDurationMs = durationMs
			}
		},

		tick: (nowMs: number, framesCount: number): number => {
			const dt = nowMs - lastTickMs
			lastTickMs = nowMs

			// no previous tick / non-monotonic clock / stall — don't advance
			if (!Number.isFinite(dt) || dt <= 0 || dt > MAX_FRAME_DELTA_MS || smoothedDurationMs <= 0) {
				return getSpriteIndex(phase, framesCount)
			}

			// lerp (EMA, frame-rate independent):
			//   alpha = 1 - e^(-dt / tauMs)
			//   smoothed += alpha * (target - smoothed)
			const alpha = 1 - Math.exp(-dt / tauMs)
			smoothedDurationMs += alpha * (targetDurationMs - smoothedDurationMs)

			// Phase in [0; 1): += fraction of the cycle elapsed (dt / durationMs), % 1 wraps back to 0
			phase = (phase + dt / smoothedDurationMs) % 1

			return getSpriteIndex(phase, framesCount)
		},
	}
}
