import Gio from 'gi://Gio'
import { LOG_PREFIX } from './constants.js'
import type { CharacterState } from './types'


/**
 * Get the duration of a full animation cycle in milliseconds.
 *
 * `f(x)` is the duration of a full animation cycle (for all sprite frames, any count) for the CPU utilization(`x`)
 * `f(x) = d_min + (d_max - d_min)·(1 − x)^k` ms, `x` in `[0; 1]`
 * `f(x) = 175 + 825·(1 − x)^3` ms, with `d_min = 175`, `d_max = 1000`, `k = 3`
 *
 * @param {number} cpuUtilization - CPU utilization in `[0; 1]`
 *
 * @returns {number} duration of a full animation cycle in milliseconds
 **/
export const getAnimationCycleDurationMs = (cpuUtilization: number): number =>
	Math.ceil(175 + 825 * (1 - cpuUtilization) ** 3)

const formatter = new Intl.NumberFormat(undefined, {
	maximumFractionDigits: 0,
	style: 'percent',
})

/**
 * Format a fraction as a localized percentage without decimals.
 *
 * @param {number} value - value in `[0; 1]`
 *
 * @returns {string} localized percentage string
 **/
export const formatNumber = (value: number): string => formatter.format(value)

/**
 * Load sprite icons per character state, auto-discovering `sprite-<i>-symbolic.svg` files.
 *
 * @param {string} root - extension root path
 *
 * @returns {Record<CharacterState, Gio.Icon[]>} sprites per state
 **/
export const getSpritesPack = (root: string): Record<CharacterState, Gio.Icon[]> => {
	const loadState = (state: CharacterState): Gio.Icon[] => {
		const sprites: Gio.Icon[] = []
		let i = 0

		while (true) {
			const path = `${root}/resources/icons/runcat/${state}/sprite-${i}-symbolic.svg`

			if (!Gio.file_new_for_path(path).query_exists(null)) {
				break
			}

			sprites.push(Gio.icon_new_for_string(path))
			i++
		}

		if (sprites.length === 0) {
			console.error(`${LOG_PREFIX}: no sprites found for "${state}" state`)
		}

		return sprites
	}

	return {
		active: loadState('active'),
		idle: loadState('idle'),
	}
}
