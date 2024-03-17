import Gio from 'gi://Gio'
import Gtk from 'gi://Gtk'
import GObject from 'gi://GObject'
import GLib from 'gi://GLib'
import St from 'gi://St' // eslint-disable-line no-unused-vars

import { Button as PanelMenuButton } from 'resource:///org/gnome/shell/ui/panelMenu.js'
import { PopupSeparatorMenuItem } from 'resource:///org/gnome/shell/ui/popupMenu.js'
import { trySpawnCommandLine } from 'resource:///org/gnome/shell/misc/util.js'
import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js'

import {
	SYSTEM_MONITOR_COMMAND,
	displayingItems,
	gioSettingsKeys,
} from './constants.js'

import createCpuGenerator, { MAX_CPU_UTILIZATION } from './dataProviders/cpu.js'


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


export default class RunCatIndicator extends PanelMenuButton {
	static {
		GObject.registerClass(this)
	}

	#extension = null

	/** @type {Gio.Settings} */
	#gioSettings

	/** @type {{ icon: St.Icon, label: St.Label, labelBox: St.BoxLayout, box: St.BoxLayout }} */
	#widgets

	/** @type {Gtk.Builder} */
	#builder

	/**
	 * @type {{
	 *	idleThreshold: number,
	 *	invertSpeed: boolean,
	 *	displayingItems: { character: boolean, percentage: boolean }
	 * }}
	*/
	#settings

	/** @type {{ [key: string]: number }} */
	#sourceIds = {}

	/** @type {{ [key: string]: Generator|AsyncGenerator }} */
	#dataProviders = { cpu: createCpuGenerator() }

	/** @type {{ cpu: number }} */
	#data = { cpu: 0 }

	/** @type {{ idle: Generator, active: Generator }} */
	#icons

	#formatter = new Intl.NumberFormat(undefined, {
		maximumFractionDigits: 0,
		style: 'percent',
	})

	constructor(extension) {
		super(null)

		this.#extension = extension
		this.#gioSettings = this.#extension.getSettings()

		this.#initSettingsListeners()
		this.#initUi()
		this.#initIcons()
		this.#initSources() // async
	}

	async refreshData() {
		this.#data.cpu = (await this.#dataProviders.cpu.next()).value

		return GLib.SOURCE_CONTINUE
	}

	repaintUi() {
		let utilization = this.#data?.cpu
		let isActive = utilization > this.#settings.idleThreshold / 100

		if (this.#settings.invertSpeed) {
			utilization = MAX_CPU_UTILIZATION - utilization
			isActive = true  // always active when speed is inverted
		}

		/** @type {CharacterState} */
		const characterState = isActive ? 'active' : 'idle'
		const [sprite, spritesCount] = this.#icons[characterState].next().value

		this.#widgets.icon.set_gicon(sprite)
		this.#widgets.label.set_text(this.#formatter.format(this.#data.cpu))

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
		this.#widgets.icon.set_gicon(sprite)
	}

	#initUi() {
		this.#builder = new Gtk.Builder({ translation_domain: this.#extension.uuid })
		this.#builder.add_from_file(`${this.#extension.path}/resources/ui/extension.ui`)

		this.#widgets = {
			icon: /** @type {St.Icon} */ (this.#builder.get_object('icon')),
			labelBox: /** @type {St.BoxLayout} */ (this.#builder.get_object('labelBox')),
			label: /** @type {St.Label} */ (this.#builder.get_object('label')),
			box: /** @type {St.BoxLayout} */ (this.#builder.get_object('box')),
		}

		this.#widgets.labelBox.add_child(this.#widgets.label)

		this.#widgets.box.add_child(this.#widgets.icon)
		this.#widgets.box.add_child(this.#widgets.labelBox)

		this.#updateItemsVisibility()

		this.add_child(this.#widgets.box)

		this.menu.addAction(
			_('Open System Monitor'),
			() => trySpawnCommandLine(SYSTEM_MONITOR_COMMAND),
		)
		this.menu.addMenuItem(new PopupSeparatorMenuItem())
		this.menu.addAction(_('Settings'), () => {
			try {
				this.#extension.openPreferences()
			} catch (e) {
				logError(e)
			}
		})
	}

	#initSettingsListeners() {
		this.#settings = {
			idleThreshold: this.#gioSettings.get_int(gioSettingsKeys.IDLE_THRESHOLD),
			displayingItems: displayingItems[this.#gioSettings.get_enum(gioSettingsKeys.DISPLAYING_ITEMS)],
			invertSpeed: this.#gioSettings.get_boolean(gioSettingsKeys.INVERT_SPEED),
		}

		this.#gioSettings.connect('changed', (_, key) => {
			switch (key) {
			case gioSettingsKeys.IDLE_THRESHOLD:
				this.#settings.idleThreshold = this.#gioSettings.get_int(gioSettingsKeys.IDLE_THRESHOLD)
				break

			case gioSettingsKeys.INVERT_SPEED:
				this.#settings.invertSpeed = this.#gioSettings.get_boolean(gioSettingsKeys.INVERT_SPEED)
				break

			case gioSettingsKeys.DISPLAYING_ITEMS:
				// eslint-disable-next-line max-len
				this.#settings.displayingItems = displayingItems[this.#gioSettings.get_enum(gioSettingsKeys.DISPLAYING_ITEMS)]
				this.#updateItemsVisibility()
				break
			}
		})
	}

	async #initSources() {
		await this.refreshData()
		this.#sourceIds.refreshData = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 3_000, () => this.refreshData())

		this.#sourceIds.repaintUi = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 0, () => this.repaintUi())
	}

	#updateItemsVisibility() {
		const characterAction = this.#settings.displayingItems.character ? 'show' : 'hide'
		this.#widgets.icon[characterAction]()

		const percentageAction = this.#settings.displayingItems.percentage ? 'show' : 'hide'
		this.#widgets.labelBox[percentageAction]()
	}

	destroy() {
		// destroy sources
		GLib.source_remove(this.#sourceIds.refreshData)
		GLib.source_remove(this.#sourceIds.repaintUi)

		// destroy UI
		this.#widgets.icon.destroy()
		this.#widgets.label.destroy()
		this.#widgets.labelBox.destroy()
		this.#widgets.box.destroy()

		super.destroy()
	}
}
