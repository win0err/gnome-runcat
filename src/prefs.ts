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
	#settings: Gio.Settings | null = null
	#builder: Gtk.Builder | null = null
	#window: Adw.PreferencesWindow | null = null

	get #headerBar(): Adw.HeaderBar | null {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const queue: any[] = [this.#window?.get_content()]

		while (queue.length > 0) {
			const child = queue.pop()
			if (child instanceof Adw.HeaderBar) {
				return child
			}

			queue.push(...child)
		}

		return null
	}

	fillPreferencesWindow(window: Adw.PreferencesWindow): void {
		this.#window = window
		this.#settings = this.getSettings()

		this.#builder = new Gtk.Builder({ translationDomain: this.uuid })
		this.#builder.add_from_file(`${this.path}/resources/ui/preferences.ui`)

		this.#setupPage()
		this.#setupMenu()

		const page = this.#builder.get_object<Adw.PreferencesPage>('preferences-general')
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
		this.#settings!.bind(
			gioSettingsKeys.IDLE_THRESHOLD,
			this.#builder!.get_object<Adw.SpinRow>(gioSettingsKeys.IDLE_THRESHOLD),
			'value',
			Gio.SettingsBindFlags.DEFAULT,
		)

		// Invert Speed
		this.#settings!.bind(
			gioSettingsKeys.INVERT_SPEED,
			this.#builder!.get_object<Adw.SwitchRow>(gioSettingsKeys.INVERT_SPEED),
			'active',
			Gio.SettingsBindFlags.DEFAULT,
		)

		// Displaying Items
		const combo = this.#builder!.get_object<Adw.ComboRow>(gioSettingsKeys.DISPLAYING_ITEMS)
		// `Gio.Settings.bind_with_mapping` is missing in GJS: https://gitlab.gnome.org/GNOME/gjs/-/issues/397
		combo.set_selected(this.#settings!.get_enum(gioSettingsKeys.DISPLAYING_ITEMS))
		combo.connect('notify::selected', (/** @type {Adw.ComboRow} */ { selected }: Adw.ComboRow) => {
			this.#settings!.set_enum(gioSettingsKeys.DISPLAYING_ITEMS, selected)
		})

		// Enable custom system monitor
		this.#settings!.bind(
			gioSettingsKeys.customSystemMonitor.ENABLED,
			this.#builder!.get_object<Adw.ExpanderRow>(gioSettingsKeys.customSystemMonitor.ENABLED),
			'enable-expansion',
			Gio.SettingsBindFlags.DEFAULT,
		)

		// Custom system monitor command
		this.#settings!.bind(
			gioSettingsKeys.customSystemMonitor.COMMAND,
			this.#builder!.get_object<Adw.EntryRow>(gioSettingsKeys.customSystemMonitor.COMMAND),
			'text',
			Gio.SettingsBindFlags.DEFAULT,
		)

		// Reset
		this.#builder!.get_object<Gtk.Button>('reset').connect('clicked', () => {
			// Idle Threshold
			this.#settings!.reset(gioSettingsKeys.IDLE_THRESHOLD)

			// Invert Speed
			this.#settings!.reset(gioSettingsKeys.INVERT_SPEED)

			// Enable custom system monitor
			this.#settings!.reset(gioSettingsKeys.customSystemMonitor.ENABLED)

			// Custom system monitor command
			this.#settings!.reset(gioSettingsKeys.customSystemMonitor.COMMAND)

			// Displaying Items
			this.#settings!.reset(gioSettingsKeys.DISPLAYING_ITEMS)
			combo.set_selected(this.#settings!.get_enum(gioSettingsKeys.DISPLAYING_ITEMS))
		})
	}

	#setupMenu() {
		if (!this.#builder) return

		const homepageAction = Gio.SimpleAction.new('homepage', null)
		homepageAction.connect(
			'activate',
			() => Gtk.show_uri(this.#window, this.metadata.url!, Gdk.CURRENT_TIME),
		)

		const aboutAction = Gio.SimpleAction.new('about', null)
		aboutAction.connect('activate', () => {
			const logo = Gtk.Image.new_from_file(`${this.path}/resources/se.kolesnikov.runcat.svg`)

			const aboutDialog = this.#builder!.get_object<Adw.AboutWindow>('about-dialog')
			aboutDialog.set_property('logo', logo.get_paintable())
			aboutDialog.set_property('version', `${_('Version')} ${this.metadata.version}`)
			aboutDialog.set_property('transient_for', this.#window)

			aboutDialog.show()
		})

		const group = Gio.SimpleActionGroup.new()
		group.add_action(homepageAction)
		group.add_action(aboutAction)

		const menu = this.#builder.get_object<Gtk.MenuButton>('menu-button')
		menu.insert_action_group('prefs', group)

		this.#headerBar?.pack_end(menu)
	}
}
