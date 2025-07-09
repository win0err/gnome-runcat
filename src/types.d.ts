import type Gio from 'gi://Gio'
import type GObject from 'gi://GObject'

import { displayingItemsOptions, indicatorBoxOptions, indicatorPositionOptions } from './constants'


export type DictValues<T extends object> = T[keyof T]

export type DisplayingItems = { character: boolean; percentage: boolean }

export type DisplayingItemsOption = DictValues<typeof displayingItemsOptions>

export type CharacterState = 'idle' | 'active'

export type SpriteTuple = [Gio.Icon, number]

export type WithInheritedGObjectParams<T extends Record<string, GObject.ParamSpec>> = {
    [K in keyof T]: T[K] extends GObject.ParamSpec<infer U> ? U : never
}

export type IndicatorPositionOption = DictValues<typeof indicatorPositionOptions>

export type IndicatorPosition = 0 | -1

export type IndicatorBoxOption = DictValues<typeof indicatorBoxOptions>

export type IndicatorBox = 'left' | 'center' | 'right'
