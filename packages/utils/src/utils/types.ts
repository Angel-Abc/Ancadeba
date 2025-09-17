/**
 * Function used to clean up resources such as event listeners or subscriptions.
 *
 * @example
 * const stopListening: CleanUp = () => window.removeEventListener('resize', onResize)
 * window.addEventListener('resize', onResize)
 * stopListening()
 */
export type CleanUp = () => void

/**
 * Message object transmitted through the message bus.
 *
 * @template T - Type of the optional payload included with the message.
 * @example
 * const msg: Message<number> = { message: 'ScoreUpdate', payload: 5 }
 * bus.publish(msg)
 */
export interface Message<T = unknown> {
    message: string
    payload?: T
}

/**
 * Numeric severity levels for logging.
 *
 * @example
 * logger.log(LogLevel.info, 'Application started')
 */
export const LogLevel = {
    debug: 0,
    info: 1,
    warning: 2,
    error: 3
} as const

/** Type representing the value union of {@link LogLevel}. */
export type LogLevel = typeof LogLevel[keyof typeof LogLevel]
