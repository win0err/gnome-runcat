import type {
	DisplayingItemNick,
	DisplayingItems,
	RunCatIndicatorReactiveProperties,
} from './types'


export const LOG_PREFIX = 'RuncatExtension'

export const SYSTEM_MONITOR_COMMAND = 'gnome-system-monitor -r'

export const displayingItemNickToValue: Record<DisplayingItemNick, DisplayingItems> = {
	'character-and-percentage': { character: true, percentage: true },
	'percentage-only': { character: false, percentage: true },
	'character-only': { character: true, percentage: false },
} as const

export const SettingsSchemaKeys = {
	IDLE_THRESHOLD: 'idle-threshold',
	DISPLAYING_ITEMS: 'displaying-items',
	INVERT_SPEED: 'invert-speed',
	CUSTOM_SYSTEM_MONITOR: {
		ENABLED: 'custom-system-monitor-enabled',
		COMMAND: 'custom-system-monitor-command',
	},
} as const

export const ReactiveProperties = {
	CPU_USAGE: 'cpuUsage',
	CURRENT_SPRITE_FRAME: 'currentSpriteFrame',
	DISPLAYING_ITEMS: 'displayingItems',
	IS_SPEED_INVERTED: 'isSpeedInverted',
	IDLE_THRESHOLD: 'idleThreshold',
} as const satisfies Record<string, keyof RunCatIndicatorReactiveProperties>
