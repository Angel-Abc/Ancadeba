import type { Component } from './component'
import type { Condition } from './condition'
import type { Input } from './inputs'

export interface GridScreenPosition {
    top: number
    left: number
    right: number
    bottom: number
}

export interface GridScreenItem {
    position: GridScreenPosition
    component: Component
    condition?: Condition
}

export interface GridScreen {
    type: 'grid'
    width: number
    height: number
    components: GridScreenItem[]
}
export type Screen = GridScreen

export type Page = {
    id: string
    screen: Screen
    inputs: Input[]
}
