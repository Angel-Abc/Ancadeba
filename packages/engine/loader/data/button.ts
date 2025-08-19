import type { Action } from './action'

/**
 * Represents an interactive button that triggers an {@link Action} when pressed.
 *
 * @property id     Unique symbol identifying the button.
 * @property label  Text displayed to the player.
 * @property action Action executed upon activation.
 */
export interface Button {
    id: symbol
    label: string
    action: Action
}
