import Adw from 'gi://Adw'
import Gio from 'gi://Gio'
import Gtk from 'gi://Gtk'
import Gdk from 'gi://Gdk'

import {
	ExtensionPreferences,
	gettext as _,
} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js'

import { gioSettingsKeys } from './constants.js'


export default class RunCatPreferences extends ExtensionPreferences {
	/** @type {Gio.Settings} */
	#settings

	/** @type {Gtk.Builder} */
	#builder

	/** @type {Adw.PreferencesWindow} */
	#window

	/** @type {Adw.HeaderBar?} */
	get #headerBar() {
		const queue = [this.#window.get_content()]

		while (queue.length > 0) {
			const child = queue.pop()
			if (child instanceof Adw.HeaderBar) {
				return child
			}

			queue.push(...child)
		}

		return null
	}

	fillPreferencesWindow(window) {
		this.#window = window

		this.#settings = this.getSettings()

		this.#builder = new Gtk.Builder({ translation_domain: this.uuid })
		this.#builder.add_from_file(`${this.path}/resources/ui/preferences.ui`)

		this.#setupPage()
		this.#setupMenu()

		const page = /** @type {Adw.PreferencesPage} */ (this.#builder.get_object('preferences-general'))
		this.#window.add(page)

		this.#window.title = _('RunCat Settings')

		// force fields to be garbage collected on window close
		this.#window.connect('close-request', () => {
			this.#settings = null
			this.#builder = null
			this.#window = null
		})
	}

	#setupPage() {
		// Idle Threshold
		this.#settings.bind(
			gioSettingsKeys.IDLE_THRESHOLD,
			this.#builder.get_object(gioSettingsKeys.IDLE_THRESHOLD),
			'value',
			Gio.SettingsBindFlags.DEFAULT,
		)

		// Displaying Items
		const combo = /** @type {Adw.ComboRow} */ (this.#builder.get_object(gioSettingsKeys.DISPLAYING_ITEMS))
		// `Gio.Settings.bind_with_mapping` is missing in GJS: https://gitlab.gnome.org/GNOME/gjs/-/issues/397
		combo.set_selected(this.#settings.get_enum(gioSettingsKeys.DISPLAYING_ITEMS))
		combo.connect('notify::selected', ({ selected }) => {
			this.#settings.set_enum(gioSettingsKeys.DISPLAYING_ITEMS, selected)
		})

		// Reset
		this.#builder.get_object('reset').connect('clicked', () => {
			// Idle Threshold
			this.#settings.reset(gioSettingsKeys.IDLE_THRESHOLD)

			// Displaying Items
			this.#settings.reset(gioSettingsKeys.DISPLAYING_ITEMS)
			combo.set_selected(this.#settings.get_enum(gioSettingsKeys.DISPLAYING_ITEMS))
		})
	}

	#setupMenu() {
		const homepageAction = Gio.SimpleAction.new('homepage', null)
		homepageAction.connect(
			'activate',
			() => Gtk.show_uri(this.#window, this.metadata.url, Gdk.CURRENT_TIME),
		)

		const aboutAction = Gio.SimpleAction.new('about', null)
		aboutAction.connect('activate', () => {
			const logo = Gtk.Image.new_from_file(`${this.path}/resources/se.kolesnikov.runcat.svg`)

			const aboutDialog = /** @type {Adw.AboutWindow} */ (this.#builder.get_object('about-dialog'))
			aboutDialog.set_property('logo', logo.get_paintable())
			aboutDialog.set_property('version', `${_('Version')} ${this.metadata.version}`)
			aboutDialog.set_property('transient_for', this.#window)

			aboutDialog.show()
		})

		const group = Gio.SimpleActionGroup.new()
		group.add_action(homepageAction)
		group.add_action(aboutAction)

		const menu = /** @type {Gtk.MenuButton} */ (this.#builder.get_object('menu-button'))
		menu.insert_action_group('prefs', group)

		this.#headerBar?.pack_end(menu)
	}
}
