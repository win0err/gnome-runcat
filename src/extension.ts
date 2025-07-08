import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js'
import { panel as MainPanel } from 'resource:///org/gnome/shell/ui/main.js'
import type { Button as PanelMenuButton } from 'resource:///org/gnome/shell/ui/panelMenu.js'

import RunCatIndicator from './indicator'

import { indicatorPositions, indicatorBoxes } from './constants'
import type { IndicatorPosition, IndicatorBox } from './types'


export default class RunCatExtension extends Extension {
	#indicator: PanelMenuButton | null = null

	enable() {
		this.#addIndicatorToPanel(indicatorPositions.END, indicatorBoxes.CENTER)
	}

	disable() {
		this.#ensureIndicatorDestroyed()
	}

	#addIndicatorToPanel(
		position: IndicatorPosition = indicatorPositions.START,
		box: IndicatorBox = indicatorBoxes.RIGHT,
	) {
		this.#ensureIndicatorDestroyed()

		this.#indicator = new RunCatIndicator(this)
		MainPanel.addToStatusArea('runcat-indicator', this.#indicator, position, box)
	}

	#ensureIndicatorDestroyed() {
		if (!this.#indicator) return

		this.#indicator.destroy()
		this.#indicator = null
	}
}
