import type { Action } from './action'
import type { Condition } from './condition'

/**
 * Behavioral options applied while a dialog is active.
 *
 * @property canMove Whether the player can move during the dialog.
 */
export type Behavior = {
    canMove: boolean
}

/**
 * Action that jumps to another dialog within the same set.
 *
 * @property type   Discriminator for the action, always `'goto'`.
 * @property target Identifier of the dialog to show next.
 */
export type GotoDialogAction = {
    type: 'goto'
    target: string
}

/** Union of all actions that may occur as a dialog result. */
export type DialogAction = Action | GotoDialogAction

/**
 * Single selectable option presented to the player in a dialog.
 *
 * @property id      Unique identifier for the choice.
 * @property label   Text shown to the player.
 * @property visible Condition that controls visibility of the choice.
 * @property enabled Condition that controls whether the choice is selectable.
 * @property action  Action executed when the choice is chosen.
 */
export type DialogChoice = {
    id: string
    label: string
    visible?: Condition
    enabled?: Condition
    action: DialogAction
}

/**
 * Dialog message presented to the player with a set of choices.
 *
 * @property id       Identifier used to reference the dialog.
 * @property message  Text displayed as the dialog content.
 * @property behavior Behavior configuration active during the dialog.
 * @property choices  Available options the player can select.
 */
export type Dialog = {
    id: string
    message: string
    behavior: Behavior
    choices: DialogChoice[]
}

/**
 * Collection of dialogs grouped under a common identifier.
 *
 * @property id             Identifier for the dialog set.
 * @property startCondition Condition that must be true to start this set.
 * @property startWith      Identifier of the first dialog to display.
 * @property dialogs        Mapping of dialog ids to definitions.
 */
export type DialogSet = {
    id: string
    startCondition: Condition
    startWith: string
    dialogs: Record<string, Dialog>
}
