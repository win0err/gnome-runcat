import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js'
import { panel as MainPanel } from 'resource:///org/gnome/shell/ui/main.js'
import type { Button as PanelMenuButton } from 'resource:///org/gnome/shell/ui/panelMenu.js'

import RunCatIndicator from './indicator.js'

import {
	gioSettingsKeys,
	enumToIndicatorPositions,
	enumToIndicatorBoxes,
	DEFAULT_INDICATOR_POSITION,
	DEFAULT_INDICATOR_BOX,
} from './constants.js'

import type { IndicatorPosition, IndicatorBox, IndicatorPositionOption, IndicatorBoxOption } from './types'


export default class RunCatExtension extends Extension {
	#indicator: PanelMenuButton | null = null

	get #position() {
		const option = this.getSettings().get_enum(gioSettingsKeys.indicator.POSITION) as IndicatorPositionOption

		return enumToIndicatorPositions[option] ?? DEFAULT_INDICATOR_POSITION
	}

	get #box() {
		const option = this.getSettings().get_enum(gioSettingsKeys.indicator.BOX) as IndicatorBoxOption

		return enumToIndicatorBoxes[option] ?? DEFAULT_INDICATOR_BOX
	}

	enable() {
		this.#addIndicatorToPanel()
		this.#initSettingsListeners()
	}

	disable() {
		this.#ensureIndicatorDestroyed()
	}

	#initSettingsListeners() {
		const onChange = () => this.#addIndicatorToPanel()

		this.getSettings().connect(`changed::${gioSettingsKeys.indicator.BOX}`, onChange)
		this.getSettings().connect(`changed::${gioSettingsKeys.indicator.POSITION}`, onChange)
	}

	#addIndicatorToPanel(
		position: IndicatorPosition = this.#position,
		box: IndicatorBox = this.#box,
	) {
		this.#ensureIndicatorDestroyed()

		this.#indicator = new RunCatIndicator(this)
		MainPanel.addToStatusArea('runcat-indicator', this.#indicator, Number(position), box)
	}

	#ensureIndicatorDestroyed() {
		if (!this.#indicator) return

		this.#indicator.destroy()
		this.#indicator = null
	}
}
