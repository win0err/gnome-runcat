import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js'
import { panel as MainPanel } from 'resource:///org/gnome/shell/ui/main.js'

import RunCatIndicator from './indicator.js'


export default class RunCatExtension extends Extension {
	/** @type {import('resource:///org/gnome/shell/ui/panelMenu.js').Button} */
	#indicator

	enable() {
		this.#indicator = new RunCatIndicator(this)
		MainPanel.addToStatusArea('runcat-indicator', this.#indicator)
	}

	disable() {
		this.#indicator.destroy()
		this.#indicator = null
	}
}
