export const LOG_PREFIX = 'RuncatExtension'
export const LOG_ERROR_PREFIX = 'RuncatExtensionError'

const CHARACTER_AND_PERCENTAGE = 0
const PERCENTAGE_ONLY = 1
const CHARACTER_ONLY = 2

export const displayingItems = {
	[CHARACTER_AND_PERCENTAGE]: { character: true, percentage: true },
	[PERCENTAGE_ONLY]: { character: false, percentage: true },
	[CHARACTER_ONLY]: { character: true, percentage: false },
}

export const gioSettingsKeys = {
	IDLE_THRESHOLD: 'idle-threshold',
	DISPLAYING_ITEMS: 'displaying-items',
	INVERT_SPEED: 'invert-speed',
}

export const SYSTEM_MONITOR_COMMAND = 'gnome-system-monitor -r'
