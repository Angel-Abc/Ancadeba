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

/** Union of all supported action definitions. */
export type Action = PostMessageAction | ScriptAction

/** Base shape for actions used when only the type discriminator is known. */
export type BaseAction = { type: string }
