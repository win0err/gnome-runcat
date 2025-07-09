import Gio from 'gi://Gio'
import GObject from 'gi://GObject'

import type {
	DisplayingItems,
	DisplayingItemsOption,
	IndicatorBox,
	IndicatorBoxOption,
	IndicatorPosition,
	IndicatorPositionOption,
} from './types'


export const displayingItemsOptions = {
	CHARACTER_AND_PERCENTAGE: 0,
	PERCENTAGE_ONLY: 1,
	CHARACTER_ONLY: 2,
} as const

export const enumToDisplayingItems: Record<DisplayingItemsOption, DisplayingItems> = {
	[displayingItemsOptions.CHARACTER_AND_PERCENTAGE]: { character: true, percentage: true },
	[displayingItemsOptions.PERCENTAGE_ONLY]: { character: false, percentage: true },
	[displayingItemsOptions.CHARACTER_ONLY]: { character: true, percentage: false },
}


export const indicatorPositionOptions = {
	START: 0,
	END: 1,
} as const

export const enumToIndicatorPositions: Record<IndicatorPositionOption, IndicatorPosition> = {
	[indicatorPositionOptions.START]: 0,
	[indicatorPositionOptions.END]: -1,
}

export const DEFAULT_INDICATOR_POSITION = enumToIndicatorPositions[indicatorPositionOptions.START]

export const indicatorBoxOptions = {
	LEFT: 0,
	CENTER: 1,
	RIGHT: 2,
} as const

export const enumToIndicatorBoxes: Record<IndicatorBoxOption, IndicatorBox> = {
	[indicatorBoxOptions.LEFT]: 'left',
	[indicatorBoxOptions.CENTER]: 'center',
	[indicatorBoxOptions.RIGHT]: 'right',
} as const

export const DEFAULT_INDICATOR_BOX = enumToIndicatorBoxes[indicatorBoxOptions.RIGHT]

export const gioSettingsKeys = {
	IDLE_THRESHOLD: 'idle-threshold',
	DISPLAYING_ITEMS: 'displaying-items',
	INVERT_SPEED: 'invert-speed',
	customSystemMonitor: {
		ENABLED: 'custom-system-monitor-enabled',
		COMMAND: 'custom-system-monitor-command',
	},
	indicator: {
		POSITION: 'indicator-position',
		BOX: 'indicator-box',
	},
} as const

export const SYSTEM_MONITOR_COMMAND = 'gnome-system-monitor -r'


export const indicatorGObjectPropertyNames = {
	currentText: 'currentText',
	currentIcon: 'currentIcon',
	displayingItems: 'displayingItems',
	isSpeedInverted: 'isSpeedInverted',
	idleThreshold: 'idleThreshold',
	useCustomSystemMonitor: 'useCustomSystemMonitor',
	customSystemMonitorCommand: 'customSystemMonitorCommand',
} as const

export const indicatorGObjectProperties: Record<keyof typeof indicatorGObjectPropertyNames, GObject.ParamSpec> = {
	currentText: GObject.ParamSpec.string(
		'currentText', '', '',
		GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, '...',
	),
	currentIcon: GObject.ParamSpec.object<Gio.Icon>(
		'currentIcon', '', '',
		// @ts-expect-error: Wrong GObject.ParamSpec.object definition
		GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
		Gio.Icon.$gtype,
	),

	displayingItems: GObject.ParamSpec.jsobject<DisplayingItems>(
		'displayingItems', '', '',
		GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
	),

	isSpeedInverted: GObject.ParamSpec.boolean(
		'isSpeedInverted', '', '',
		GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, false,
	),
	idleThreshold: GObject.ParamSpec.int(
		'idleThreshold', '', '',
		GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, 0, 100, 0,
	),

	useCustomSystemMonitor: GObject.ParamSpec.boolean(
		'useCustomSystemMonitor', '', '',
		GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, false,
	),
	customSystemMonitorCommand: GObject.ParamSpec.string(
		'customSystemMonitorCommand', '', '',
		GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, SYSTEM_MONITOR_COMMAND,
	),
}
