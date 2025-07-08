import Gio from 'gi://Gio'
import type { CharacterState, SpriteTuple } from './types'


export const spritesGenerator = function* (
	extensionRootPath: string,
	state: CharacterState,
): Generator<SpriteTuple, SpriteTuple, void> {
	const getPathForIdx = (
		idx: number,
	) => `${extensionRootPath}/resources/icons/runcat/${state}/sprite-${idx}-symbolic.svg`

	const sprites: Gio.Icon[] = []

	for (
		let i = 0, path = getPathForIdx(i);
		Gio.file_new_for_path(path).query_exists(null);
		i++, path = getPathForIdx(i)
	) { sprites.push(Gio.icon_new_for_string(path)) }

	while (true) {
		for (let i = 0; i < sprites.length; i++) {
			yield [sprites[i], sprites.length]
		}
	}
}

/**
 * Get animation interval in milliseconds.
 *
 * `f(x)` is a number of seconds of a full animation cycle (for all sprites) for the specified CPU load (`x`) \
 * `f(x) = 25 / sqrt(x + 30) - 2` for `x` in `[0; 100]`
 *
 * @param {number} cpuUtilization
 * @param {number} spritesCount
 *
 * @returns {number} delay between sprites in millisecons
 **/
export const getAnimationInterval = (
	cpuUtilization: number,
	spritesCount: number,
): number => Math.ceil(
	(25 / Math.sqrt(cpuUtilization*100 + 30) - 2) * 1_000 / spritesCount,
)

