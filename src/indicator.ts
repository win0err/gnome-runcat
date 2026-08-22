import Clutter from 'gi://Clutter'
import Gio from 'gi://Gio'
import GObject from 'gi://GObject'
import GLib from 'gi://GLib'
import St from 'gi://St'

import * as Main from 'resource:///org/gnome/shell/ui/main.js'
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js'
import { trySpawnCommandLine } from 'resource:///org/gnome/shell/misc/util.js'
import { type PopupMenu, PopupSeparatorMenuItem } from 'resource:///org/gnome/shell/ui/popupMenu.js'
import { type Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js'

import {
	LOG_PREFIX,
	SYSTEM_MONITOR_COMMAND,
	displayingItemNickToValue,
	SettingsSchemaKeys,
	ReactiveProperties,
} from './constants.js'

import {
	getAnimationCycleDurationMs,
	formatNumber,
	getSpritesPack,
} from './utils.js'

import createCpuGenerator, { MAX_CPU_UTILIZATION } from './dataProviders/cpu.js'

import type {
	DisplayingItems,
	CharacterState,
	RunCatIndicatorReactiveProperties,
	DisplayingItemNick,
	GObjectProperties,
} from './types'


// eslint-disable-next-line max-len
export default class RunCatIndicator extends PanelMenu.Button implements RunCatIndicatorReactiveProperties {
	declare menu: PopupMenu

	declare idleThreshold: number
	declare displayingItems: DisplayingItems
	declare isSpeedInverted: boolean

	declare cpuUsage: number
	declare currentSpriteFrame: Gio.Icon

	static {
		GObject.registerClass({
			Properties: {
				cpuUsage: GObject.ParamSpec.float(
					'cpuUsage',
					'CPU usage',
					'Latest CPU utilization in [0, 1], sampled every 3 seconds',
					GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, 0, 1, 0,
				),

				currentSpriteFrame: GObject.ParamSpec.object<Gio.Icon>(
					'currentSpriteFrame',
					'Current sprite frame',
					'Sprite currently displayed for the character state',
					GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, Gio.Icon,
				),

				displayingItems: GObject.ParamSpec.jsobject<DisplayingItems>(
					'displayingItems',
					'Displaying items',
					'Which elements to show: the character and/or the CPU percentage',
					GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
				),

				isSpeedInverted: GObject.ParamSpec.boolean(
					'isSpeedInverted',
					'Invert speed',
					'When true, the animation speed is inverted and the character is always active',
					GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
					false,
				),

				idleThreshold: GObject.ParamSpec.int(
					'idleThreshold',
					'Idle threshold',
					'CPU percentage below which the character is considered idle (0-100)',
					GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, 0, 100, 0,
				),
			} satisfies GObjectProperties<RunCatIndicatorReactiveProperties>,
		}, this)
	}

	extension: Extension
	timeline!: Clutter.Timeline
	refreshDataTimeoutId!: number
	displayingItemsHandlerId!: number
	animationUpdaterHandlerId!: number
	sprites: Record<CharacterState, Gio.Icon[]>

	constructor(extension: Extension) {
		super(0.5, 'RunCat', false)

		this.extension = extension
		this.sprites = getSpritesPack(this.extension.path)

		this.initSettingsListeners()
		this.initDataRefreshSource()
		this.initUi()
	}

	get characterState(): CharacterState {
		if (this.isSpeedInverted) {
			return 'active'
		}

		return this.cpuUsage > this.idleThreshold / 100 ? 'active' : 'idle'
	}

	get frames(): Gio.Icon[] {
		return this.sprites[this.characterState]
	}

	get systemMonitorCommand() {
		const settings = this.extension.getSettings()

		const useCustomSystemMonitor = settings.get_boolean(SettingsSchemaKeys.CUSTOM_SYSTEM_MONITOR.ENABLED)
		const customSystemMonitorCommand = settings.get_string(SettingsSchemaKeys.CUSTOM_SYSTEM_MONITOR.COMMAND)

		return useCustomSystemMonitor ? customSystemMonitorCommand : SYSTEM_MONITOR_COMMAND
	}

	initDataRefreshSource() {
		const cpuDataProvider = createCpuGenerator()

		const refresh = () => {
			cpuDataProvider.next().then(
				({ value }) => { this.cpuUsage = value },
				(e: unknown) => console.error(`${LOG_PREFIX}: ${e}`),
			)

			return GLib.SOURCE_CONTINUE
		}

		this.refreshDataTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 3_000, refresh)

		refresh()
	}

	initUi() {
		const box = new St.BoxLayout({
			styleClass: 'panel-status-menu-box runcat-menu',
		})

		const icon = new St.Icon({
			styleClass: 'system-status-icon runcat-menu__icon',
		})

		const label = new St.Label({
			text: '...',
			styleClass: 'runcat-menu__label',
			xExpand: true,
			yExpand: true,
			xAlign: Clutter.ActorAlign.FILL,
			yAlign: Clutter.ActorAlign.CENTER,
		})

		this.bind_property_full(
			ReactiveProperties.CPU_USAGE,
			label, 'text',
			GObject.BindingFlags.SYNC_CREATE,
			(_, usage: number) => [true, formatNumber(usage)],
			null,
		)

		this.bind_property_full(
			ReactiveProperties.DISPLAYING_ITEMS,
			label, 'visible',
			GObject.BindingFlags.SYNC_CREATE,
			(_, { percentage }: DisplayingItems) => [true, percentage],
			null,
		)

		this.bind_property(ReactiveProperties.CURRENT_SPRITE_FRAME, icon, 'gicon', GObject.BindingFlags.DEFAULT)

		this.bind_property_full(
			ReactiveProperties.DISPLAYING_ITEMS,
			icon, 'visible',
			GObject.BindingFlags.SYNC_CREATE,
			(_, { character }: DisplayingItems) => [true, character],
			null,
		)

		box.add_child(icon)
		box.add_child(label)

		this.add_child(box)

		this.initAnimation(icon)

		this.menu.addAction(_('Open System Monitor'), () => {
			try {
				trySpawnCommandLine(this.systemMonitorCommand)
			} catch (e: unknown) {
				if (e instanceof Error) {
					Main.notifyError(_('Execution of “%s” failed').format(this.systemMonitorCommand), e.message)
				}

				console.error(e)
			}
		})

		this.menu.addMenuItem(new PopupSeparatorMenuItem())
		this.menu.addAction(_('Settings'), () => {
			try {
				this.extension.openPreferences()
			} catch (e: unknown) {
				if (e instanceof Error) {
					Main.notifyError(_('Failed to open extension settings'), e.message)
				}

				console.error(e)
			}
		})
	}

	initAnimation(actor: Clutter.Actor) {
		this.timeline = new Clutter.Timeline({
			actor,
			duration: 1_000,
			repeatCount: -1,
		})

		// Keep this handler free of writes to registered properties other than
		// currentSpriteFrame — the global 'notify' filter in this method depends on it
		// (set_duration inside the completion window freezes the animation).
		this.timeline.connect('new-frame', () => {
			const progress = this.timeline.get_progress()
			const rawIndex = Math.floor(progress * this.frames.length) % this.frames.length
			const index = Math.max(0, rawIndex) // clamp: JS % keeps the sign, negative progress → negative index

			this.currentSpriteFrame = this.frames[index]
		})

		const updateAnimationState = () => {
			const utilization = this.isSpeedInverted
				? MAX_CPU_UTILIZATION - this.cpuUsage
				: this.cpuUsage

			this.timeline.set_duration(getAnimationCycleDurationMs(utilization))

			const shouldAnimate = this.displayingItems.character && this.frames.length > 1

			if (shouldAnimate) {
				this.timeline.start()
			} else {
				this.currentSpriteFrame = this.frames[0]

				this.timeline.pause()
			}
		}

		this.animationUpdaterHandlerId = this.connect('notify', (_, pspec: GObject.ParamSpec) => {
			// currentSpriteFrame is set from inside the 'new-frame' handler; letting this
			// notify through would run set_duration() in mutter's completion path and
			// poison the timeline's elapsed time (frozen/blank animation). See the
			// 'new-frame' handler in this method before writing any other property there.
			if (pspec.get_name() === ReactiveProperties.CURRENT_SPRITE_FRAME) return

			updateAnimationState()
		})

		updateAnimationState()
	}

	initSettingsListeners() {
		const settings = this.extension.getSettings()

		settings.bind(
			SettingsSchemaKeys.INVERT_SPEED,
			this,
			ReactiveProperties.IS_SPEED_INVERTED,
			Gio.SettingsBindFlags.DEFAULT,
		)

		settings.bind(
			SettingsSchemaKeys.IDLE_THRESHOLD,
			this,
			ReactiveProperties.IDLE_THRESHOLD,
			Gio.SettingsBindFlags.DEFAULT,
		)

		// TODO(gjs#397): replace the manual sync below with settings.bind_with_mapping
		// https://gitlab.gnome.org/GNOME/gjs/-/work_items/397
		// https://gitlab.gnome.org/fmuellner/gjs/-/commit/ce24aba9aa969b874533b4112bdda34dce2d6ea7
		//
		// settings.bind_with_mapping(
		//   gioSettingsKeys.DISPLAYING_ITEMS,
		//   this, gObjectPropertyNames.displayingItems,
		//   Gio.SettingsBindFlags.DEFAULT,
		//   (variant: GLib.Variant) => [true, displayingItemNickToValue[variant.unpack<DisplayingItemNick>()]],
		//   null
		// )

		const updateDisplayingItems = () => {
			const nick = settings.get_string(SettingsSchemaKeys.DISPLAYING_ITEMS) as DisplayingItemNick

			this.displayingItems = displayingItemNickToValue[nick]
		}

		this.displayingItemsHandlerId = settings.connect(
			`changed::${SettingsSchemaKeys.DISPLAYING_ITEMS}`,
			updateDisplayingItems,
		)

		updateDisplayingItems()
	}

	destroy() {
		GLib.source_remove(this.refreshDataTimeoutId)

		this.extension.getSettings().disconnect(this.displayingItemsHandlerId)
		this.disconnect(this.animationUpdaterHandlerId)

		this.timeline?.stop()

		super.destroy()
	}
}
