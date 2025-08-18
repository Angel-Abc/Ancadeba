
/**
 * Action that posts a message to the outer environment.
 *
 * @property type    Discriminator of the action; always `'post-message'`.
 * @property message Message identifier to send.
 * @property payload Numeric, string or object data associated with the message.
 */
export interface PostMessageAction {
    type: 'post-message'
    message: string
    payload: number | string | Record<string, unknown>
}

/**
 * Action that evaluates an arbitrary script string when executed.
 *
 * @property type   Discriminator of the action; always `'script'`.
 * @property script JavaScript code to run.
 */
export interface ScriptAction {
    type: 'script'
    script: string
}

/**
 * Action that terminates the dialog sequence.
 *
 * @property type    Discriminator for the action, always `'end-dialog'`.
 * @property message Optional message displayed when ending the dialog.
 */
export interface EndDialogAction {
    type: 'end-dialog',
    message?: string
}

/** Union of all supported action definitions. */
export type Action = PostMessageAction | ScriptAction | EndDialogAction
export type Actions = Action | Action[]

/** Base shape for actions used when only the type discriminator is known. */
export type BaseAction = { type: string }
