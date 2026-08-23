import Gio from 'gi://Gio'
import { LOG_PREFIX } from './constants.js'
import type { CharacterState } from './types'


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

const formatter = new Intl.NumberFormat(undefined, {
	maximumFractionDigits: 0,
	style: 'percent',
})

export const formatNumber = (value: number): string => formatter.format(value)
