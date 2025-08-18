import type { BaseAction } from './action'
import type { Condition } from './condition'

/**
 * Mapping between a physical key and a logical virtual key identifier.
 *
 * @property virtualKey Named identifier for the key (e.g. `"Up"`).
 * @property keyCode    DOM keyboard event `code` to listen for.
 * @property shift      Whether the Shift key must be pressed.
 * @property ctrl       Whether the Control key must be pressed.
 * @property alt        Whether the Alt key must be pressed.
 */
export interface VirtualKey {
    virtualKey: string
    keyCode: string
    shift: boolean
    ctrl: boolean
    alt: boolean
}
/** Array of {@link VirtualKey} definitions. */
export type VirtualKeys = VirtualKey[]

/**
 * Combines multiple virtual keys into a higher level virtual input.
 *
 * @property virtualInput Identifier of the virtual input.
 * @property virtualKeys  List of virtual keys that activate this input.
 * @property label        Display label for UI.
 */
export interface VirtualInput {
    virtualInput: string
    virtualKeys: string[]
    label: string
}
/** Array of {@link VirtualInput} definitions. */
export type VirtualInputs = VirtualInput[]

/**
 * Interactive input element that can appear on a page.
 *
 * @property virtualInput Identifier matching a {@link VirtualInput}.
 * @property preferredRow Optional preferred row position in a grid layout.
 * @property preferredCol Optional preferred column position in a grid layout.
 * @property label        Text shown to the player.
 * @property description  Additional explanation for the input.
 * @property visible      Condition controlling visibility.
 * @property enabled      Condition controlling whether the input is enabled.
 * @property action       Action performed when the input is triggered.
 */
export interface Input {
    virtualInput: string
    preferredRow?: number
    preferredCol?: number
    label: string
    description: string
    visible?: Condition
    enabled?: Condition
    action: BaseAction
}
