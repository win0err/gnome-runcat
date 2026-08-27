// Default EMA time constant for the animation cycle duration, ms
export const ANIMATION_SMOOTHING_TAU_MS = 500

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
 * Create an animation ticker: computes the sprite frame to show and the delay
 * until the next frame boundary, with EMA-smoothed cycle duration (an `immediate`
 * target update skips the smoothing). Stall-safe (time gaps over
 * `MAX_FRAME_DELTA_MS` don't advance the phase); `framesCount` is an `advanceTo`
 * argument, not construction state.
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
		setTargetDuration: (durationMs: number, immediate = false): void => {
			if (!Number.isFinite(durationMs) || durationMs <= 0) {
				return
			}

			targetDurationMs = durationMs

			// first call or an immediate update, skip EMA smoothing
			if (immediate || smoothedDurationMs <= 0) {
				smoothedDurationMs = durationMs
			}
		},

		// Advance the animation to the frame boundary reached at `nowMs` (call
		// `setTargetDuration` first): returns the sprite index to show now and
		// the delay until the next frame boundary, in ms
		advanceTo: (nowMs: number, framesCount: number): { index: number, nextDelayMs: number } => {
			const dt = nowMs - lastTickMs
			lastTickMs = nowMs

			// A gap counts as a stall only when it far exceeds both the expected
			// frame duration and MAX_FRAME_DELTA_MS (few sprites → long frames)
			const stallThresholdMs = Math.max(MAX_FRAME_DELTA_MS, smoothedDurationMs / framesCount)

			// no previous tick / non-monotonic clock / stall
			if (Number.isFinite(dt) && dt > 0 && dt <= stallThresholdMs && smoothedDurationMs > 0) {
				// lerp (EMA, frame-rate-independent):
				//   alpha = 1 - e^(-dt / tauMs)
				//   smoothed += alpha * (target - smoothed)
				const alpha = 1 - Math.exp(-dt / tauMs)
				smoothedDurationMs += alpha * (targetDurationMs - smoothedDurationMs)

				// Phase in [0; 1): += fraction of the cycle elapsed (dt / durationMs), % 1 wraps back to 0
				phase = (phase + dt / smoothedDurationMs) % 1
			}

			const index = getSpriteIndex(phase, framesCount)

			const nextFramePhase = (Math.floor(phase * framesCount) + 1) / framesCount

			// No duration set yet — retry later instead of busy-looping
			const nextDelayMs = smoothedDurationMs > 0
				? Math.max(1, Math.ceil((nextFramePhase - phase) * smoothedDurationMs))
				: MAX_FRAME_DELTA_MS

			return { index, nextDelayMs }
		},
	}
}
