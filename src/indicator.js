import Gio from 'gi://Gio'
import Gtk from 'gi://Gtk'
import GObject from 'gi://GObject'
import GLib from 'gi://GLib'

import * as Main from 'resource:///org/gnome/shell/ui/main.js'
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js'
import { trySpawnCommandLine } from 'resource:///org/gnome/shell/misc/util.js'
import {  PopupSeparatorMenuItem } from 'resource:///org/gnome/shell/ui/popupMenu.js'

import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js'

import {
	SYSTEM_MONITOR_COMMAND,
	enumToDisplayingItems,
	gioSettingsKeys,
	indicatorComponentKeys,
} from './constants.js'

import createCpuGenerator, { MAX_CPU_UTILIZATION } from './dataProviders/cpu.js'


/** @import { PopupMenu } from 'resource:///org/gnome/shell/ui/popupMenu.js' */
/** @import St from 'gi://St' */
/** @import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js' */
/** @import { DisplayingItems, DisplayingItemsOption } from './constants.js' */

/** @typedef {'idle' | 'active'} CharacterState */


/**
 * @param {string} extensionRootPath
 * @param {CharacterState} state
 *
 * @returns {Generator}
 **/
const spritesGenerator = function* (extensionRootPath, state) {
	/** @param {number} idx */
	const getPathForIdx = idx => `${extensionRootPath}/resources/icons/runcat/${state}/sprite-${idx}-symbolic.svg`

	const sprites = []
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
const getAnimationInterval = (cpuUtilization, spritesCount) => Math.ceil(
	(25 / Math.sqrt(cpuUtilization*100 + 30) - 2) * 1_000 / spritesCount,
)


export default class RunCatIndicator extends PanelMenu.Button {
	static {
		GObject.registerClass({
			Properties: {
				[indicatorComponentKeys.TEXT]: GObject.ParamSpec.string(
					indicatorComponentKeys.TEXT, '', '',
					GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, '...',
				),
				[indicatorComponentKeys.ICON]: GObject.ParamSpec.object(
					indicatorComponentKeys.ICON, '', '',
					// @ts-expect-error flags param is not correctly typed
					GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, Gio.FileIcon.$gtype,
				),

				[gioSettingsKeys.DISPLAYING_ITEMS]: GObject.ParamSpec.jsobject(
					gioSettingsKeys.DISPLAYING_ITEMS, '', '',
					GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
				),

				[gioSettingsKeys.INVERT_SPEED]: GObject.ParamSpec.boolean(
					gioSettingsKeys.INVERT_SPEED, '', '',
					GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, false,
				),
				[gioSettingsKeys.IDLE_THRESHOLD]: GObject.ParamSpec.int(
					gioSettingsKeys.IDLE_THRESHOLD, '', '',
					GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, 0, 100, 0,
				),

				[gioSettingsKeys.customSystemMonitor.ENABLED]: GObject.ParamSpec.boolean(
					gioSettingsKeys.customSystemMonitor.ENABLED, '', '',
					GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, false,
				),
				[gioSettingsKeys.customSystemMonitor.COMMAND]: GObject.ParamSpec.string(
					gioSettingsKeys.customSystemMonitor.COMMAND, '', '',
					GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, SYSTEM_MONITOR_COMMAND,
				),
			},
		}, this)
	}


	/** @type {Extension} */
	#extension

	/** @type {{ [key: string]: number }} */
	#sourceIds = {}

	/** @type {{ [key: string]: Generator }} */
	#dataProviders = { cpu: createCpuGenerator() }

	/** @type {{ cpu: number }} */
	#data = { cpu: 0 }

	/** @type {{ idle: Generator, active: Generator }} */
	#icons

	#formatter = new Intl.NumberFormat(undefined, {
		maximumFractionDigits: 0,
		style: 'percent',
	})

	/**
	 * @param {Extension} extension
	 */
	constructor(extension) {
		super(0.5, 'RunCat', false)

		this.#extension = extension

		this.#initSettingsListeners()
		this.#initUi()
		this.#initIcons()
		this.#initSources()
	}

	refreshData() {
		const { value: cpuValue } = this.#dataProviders.cpu.next()
		this.#data.cpu = cpuValue

		return GLib.SOURCE_CONTINUE
	}

	repaintUi() {
		// @ts-ignore [gioSettingsKeys.IDLE_THRESHOLD] is a dynamic property created by GObject
		let idleThreshold = this[gioSettingsKeys.IDLE_THRESHOLD]
		let utilization = this.#data?.cpu

		let isActive = utilization > idleThreshold / 100

		// @ts-ignore [gioSettingsKeys.INVERT_SPEED] is a dynamic property created by GObject
		const isSpeedInverted = /** @type {boolean} */ (this[gioSettingsKeys.INVERT_SPEED])
		if (isSpeedInverted) {
			utilization = MAX_CPU_UTILIZATION - utilization
			isActive = true  // always active when speed is inverted
		}

		/** @type {CharacterState} */
		const characterState = isActive ? 'active' : 'idle'
		const [sprite, spritesCount] = this.#icons[characterState].next().value

		this[indicatorComponentKeys.ICON] = sprite
		this[indicatorComponentKeys.TEXT] = this.#formatter.format(this.#data.cpu)

		const animationInterval = getAnimationInterval(utilization, spritesCount)
		this.#sourceIds.repaintUi = GLib.timeout_add(GLib.PRIORITY_DEFAULT, animationInterval, () => this.repaintUi())

		return GLib.SOURCE_REMOVE
	}

	#initIcons() {
		this.#icons = {
			idle: spritesGenerator(this.#extension.path, 'idle'),
			active: spritesGenerator(this.#extension.path, 'active'),
		}

		const [sprite] = this.#icons.idle.next().value
		this[indicatorComponentKeys.ICON] = sprite
	}

	#initUi() {
		const builder = new Gtk.Builder({ translationDomain: this.#extension.uuid })
		builder.add_from_file(`${this.#extension.path}/resources/ui/extension.ui`)

		/** @type {St.BoxLayout} */
		const box = builder.get_object('box')

		/** @type {St.Label} */
		const label = builder.get_object('label')
		this.bind_property(
			indicatorComponentKeys.TEXT,
			label, 'text',
			GObject.BindingFlags.DEFAULT,
		)

		// @ts-expect-error GObject.BindingTransformFunc return arguments are not correctly typed
		this.bind_property_full(
			gioSettingsKeys.DISPLAYING_ITEMS,
			label, 'visible',
			GObject.BindingFlags.SYNC_CREATE,
			(_, /** @type {DisplayingItems} */ { percentage }) => [true, percentage],
			null,
		)

		/** @type {St.Icon} */
		const icon = builder.get_object('icon')
		this.bind_property(
			indicatorComponentKeys.ICON,
			icon, 'gicon',
			GObject.BindingFlags.DEFAULT,
		)

		// @ts-expect-error GObject.BindingTransformFunc return arguments are not correctly typed
		this.bind_property_full(
			gioSettingsKeys.DISPLAYING_ITEMS,
			icon, 'visible',
			GObject.BindingFlags.SYNC_CREATE,
			(_, /** @type {DisplayingItems} */ { character }) => [true, character],
			null,
		)

		box.add_child(icon)
		box.add_child(label)

		this.add_child(box)

		const menu = /** @type {PopupMenu} */ (this.menu)
		menu.addAction(
			_('Open System Monitor'),
			() => {
				const {
					// @ts-ignore [gioSettingsKeys.customSystemMonitor.ENABLED] is a dynamic property created by GObject
					[gioSettingsKeys.customSystemMonitor.ENABLED]: isEnabled,
					// @ts-ignore [gioSettingsKeys.customSystemMonitor.COMMAND] is a dynamic property created by GObject
					[gioSettingsKeys.customSystemMonitor.COMMAND]: customCommand,
				} = this
				const command = isEnabled ? customCommand : SYSTEM_MONITOR_COMMAND

				try {
					trySpawnCommandLine(command)
				} catch (e) {
					Main.notifyError(
						_('Execution of “%s” failed').format(command),
						e.message,
					)
					console.error(e)
				}
			},
		)
		menu.addMenuItem(new PopupSeparatorMenuItem())
		menu.addAction(_('Settings'), () => {
			try {
				this.#extension.openPreferences()
			} catch (e) {
				Main.notifyError(_('Failed to open extension settings'), e.message)
				console.error(e)
			}
		})
	}

	#initSettingsListeners() {
		const settings = this.#extension.getSettings()

		settings.bind(
			gioSettingsKeys.INVERT_SPEED,
			this, gioSettingsKeys.INVERT_SPEED,
			Gio.SettingsBindFlags.DEFAULT,
		)

		settings.bind(
			gioSettingsKeys.IDLE_THRESHOLD,
			this, gioSettingsKeys.IDLE_THRESHOLD,
			Gio.SettingsBindFlags.DEFAULT,
		)

		settings.bind(
			gioSettingsKeys.customSystemMonitor.ENABLED,
			this, gioSettingsKeys.customSystemMonitor.ENABLED,
			Gio.SettingsBindFlags.DEFAULT,
		)

		settings.bind(
			gioSettingsKeys.customSystemMonitor.COMMAND,
			this, gioSettingsKeys.customSystemMonitor.COMMAND,
			Gio.SettingsBindFlags.DEFAULT,
		)

		// sync enum that cannot be binded
		const updateDisplayingItems = () => {
			const option = /** @type {DisplayingItemsOption} */ (settings.get_enum(gioSettingsKeys.DISPLAYING_ITEMS))
			this[gioSettingsKeys.DISPLAYING_ITEMS] = enumToDisplayingItems[option]
		}

		updateDisplayingItems()
		settings.connect(`changed::${gioSettingsKeys.DISPLAYING_ITEMS}`, updateDisplayingItems)
	}

	#initSources() {
		this.refreshData()

		this.#sourceIds.refreshData = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 3_000, () => this.refreshData())
		this.#sourceIds.repaintUi = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 0, () => this.repaintUi())
	}

	destroy() {
		// destroy sources
		GLib.source_remove(this.#sourceIds.refreshData)
		GLib.source_remove(this.#sourceIds.repaintUi)

		super.destroy()
	}
}
