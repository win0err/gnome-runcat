const displayingItemsOptions = {
	CHARACTER_AND_PERCENTAGE: 0,
	PERCENTAGE_ONLY: 1,
	CHARACTER_ONLY: 2,
}

/**
 * @typedef {{ character: boolean, percentage: boolean }} DisplayingItems
 * @typedef {typeof displayingItemsOptions[keyof typeof displayingItemsOptions]} DisplayingItemsOption
 */

/**
 * @type {Record<DisplayingItemsOption, DisplayingItems>}
 */
export const enumToDisplayingItems = {
	[displayingItemsOptions.CHARACTER_AND_PERCENTAGE]: { character: true, percentage: true },
	[displayingItemsOptions.PERCENTAGE_ONLY]: { character: false, percentage: true },
	[displayingItemsOptions.CHARACTER_ONLY]: { character: true, percentage: false },
}

export const gioSettingsKeys = /** @type {const} */ ({
	IDLE_THRESHOLD: 'idle-threshold',
	DISPLAYING_ITEMS: 'displaying-items',
	INVERT_SPEED: 'invert-speed',
	customSystemMonitor: {
		ENABLED: 'custom-system-monitor-enabled',
		COMMAND: 'custom-system-monitor-command',
	},
})


export const indicatorComponentKeys = /** @type {const} */ ({
	TEXT: 'current-text',
	ICON: 'current-icon',
})

export const SYSTEM_MONITOR_COMMAND = 'gnome-system-monitor -r'
