import type { Action } from './action'

/**
 * Associates a message identifier with an {@link Action} to perform when the
 * message is received.
 *
 * @property message Message key that triggers the handler.
 * @property action  Action executed when the message is handled.
 */
export interface Handler {
    message: string
    action: Action
}

/** Array of {@link Handler} objects defining message to action mappings. */
export type Handlers = Handler[]
