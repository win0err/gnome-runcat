import Adw from 'gi://Adw'
import Gio from 'gi://Gio'
import Gtk from 'gi://Gtk'

import {
	ExtensionPreferences,
	gettext as _,
} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js'

import { SettingsSchemaKeys } from './constants.js'


// eslint-disable-next-line no-underscore-dangle
Gio._promisify(Gtk.UriLauncher.prototype, 'launch', 'launch_finish')

export default class RunCatPreferences extends ExtensionPreferences {
	#settings: Gio.Settings | null = null
	#builder: Gtk.Builder | null = null
	#window: Adw.PreferencesWindow | null = null

	get #headerBar(): Adw.HeaderBar | null {
		const stack: Array<Gtk.Widget | null> = [this.#window]

		let widget

		while (stack.length > 0) {
			if (!(widget = stack.pop())) continue

			if (widget instanceof Adw.HeaderBar) {
				return widget
			}

			stack.push(
				widget.get_next_sibling(),
				widget.get_first_child(),
			)
		}

		return null
	}

	async fillPreferencesWindow(window: Adw.PreferencesWindow) {
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
			SettingsSchemaKeys.IDLE_THRESHOLD,
			this.#builder!.get_object<Adw.SpinRow>(SettingsSchemaKeys.IDLE_THRESHOLD),
			'value',
			Gio.SettingsBindFlags.DEFAULT,
		)

		// Invert Speed
		this.#settings!.bind(
			SettingsSchemaKeys.INVERT_SPEED,
			this.#builder!.get_object<Adw.SwitchRow>(SettingsSchemaKeys.INVERT_SPEED),
			'active',
			Gio.SettingsBindFlags.DEFAULT,
		)

		// Displaying Items
		const combo = this.#builder!.get_object<Adw.ComboRow>(SettingsSchemaKeys.DISPLAYING_ITEMS)

		// `Gio.Settings.bind_with_mapping` is missing in GJS: https://gitlab.gnome.org/GNOME/gjs/-/issues/397
		combo.set_selected(this.#settings!.get_enum(SettingsSchemaKeys.DISPLAYING_ITEMS))
		combo.connect('notify::selected', (/** @type {Adw.ComboRow} */ { selected }: Adw.ComboRow) => {
			this.#settings!.set_enum(SettingsSchemaKeys.DISPLAYING_ITEMS, selected)
		})

		// Enable custom system monitor
		this.#settings!.bind(
			SettingsSchemaKeys.CUSTOM_SYSTEM_MONITOR.ENABLED,
			this.#builder!.get_object<Adw.ExpanderRow>(SettingsSchemaKeys.CUSTOM_SYSTEM_MONITOR.ENABLED),
			'enable-expansion',
			Gio.SettingsBindFlags.DEFAULT,
		)

		// Custom system monitor command
		this.#settings!.bind(
			SettingsSchemaKeys.CUSTOM_SYSTEM_MONITOR.COMMAND,
			this.#builder!.get_object<Adw.EntryRow>(SettingsSchemaKeys.CUSTOM_SYSTEM_MONITOR.COMMAND),
			'text',
			Gio.SettingsBindFlags.DEFAULT,
		)

		// Reset
		this.#builder!.get_object<Gtk.Button>('reset').connect('clicked', () => {
			// Idle Threshold
			this.#settings!.reset(SettingsSchemaKeys.IDLE_THRESHOLD)

			// Invert Speed
			this.#settings!.reset(SettingsSchemaKeys.INVERT_SPEED)

			// Enable custom system monitor
			this.#settings!.reset(SettingsSchemaKeys.CUSTOM_SYSTEM_MONITOR.ENABLED)

			// Custom system monitor command
			this.#settings!.reset(SettingsSchemaKeys.CUSTOM_SYSTEM_MONITOR.COMMAND)

			// Displaying Items
			this.#settings!.reset(SettingsSchemaKeys.DISPLAYING_ITEMS)
			combo.set_selected(this.#settings!.get_enum(SettingsSchemaKeys.DISPLAYING_ITEMS))
		})
	}

	#setupMenu() {
		if (!this.#builder) return

		const homepageAction = Gio.SimpleAction.new('homepage', null)

		homepageAction.connect(
			'activate',
			() => new Gtk.UriLauncher({ uri: this.metadata.url! })
				.launch(this.#window, null)
				.catch(console.error),
		)

		const aboutAction = Gio.SimpleAction.new('about', null)

		aboutAction.connect('activate', () => {
			const logo = Gtk.Image.new_from_file(`${this.path}/resources/se.kolesnikov.runcat.svg`)

			const aboutDialog = this.#builder!.get_object<Gtk.AboutDialog>('about-dialog')

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
