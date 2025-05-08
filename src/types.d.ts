import type Gio from 'gi://Gio'
import type GObject from 'gi://GObject'

import { displayingItemsOptions } from './constants'


export type DisplayingItems = { character: boolean; percentage: boolean}

export type DisplayingItemsOption = (typeof displayingItemsOptions)[keyof typeof displayingItemsOptions]

export type CharacterState = 'idle' | 'active'

export type SpriteTuple = [Gio.Icon, number]

export type WithInheritedGObjectParams<T extends Record<string, GObject.ParamSpec>> = {
    [K in keyof T]: T[K] extends GObject.ParamSpec<infer U> ? U : never
}
