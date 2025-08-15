import { Token, token } from '@ioc/token'
import { CleanUp } from '@utils/types'

/**
 * Normalized keyboard event information passed to listeners.
 *
 * @property code  The {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code | code}
 *                 of the key that was pressed.
 * @property alt   Indicates whether the <kbd>Alt</kbd> key is held down.
 * @property ctrl  Indicates whether the <kbd>Control</kbd> key is held down.
 * @property shift Indicates whether the <kbd>Shift</kbd> key is held down.
 */
export interface KeyboardEvent {
    code: string
    alt: boolean
    ctrl: boolean
    shift: boolean
}

type EventListener = {
    key: number,
    listener: (event: KeyboardEvent) => void
}

/**
 * Contract for classes that register callbacks for DOM keyboard events.
 */
export interface IKeyboardEventListener {
    /**
     * Register a listener for keyboard events.
     *
     * @param listener Callback invoked for each keydown event.
     * @returns A cleanup function that removes the listener when invoked.
     */
    addListener(listener: (event: KeyboardEvent) => void): CleanUp

    /**
     * Remove all listeners and detach the DOM handler.
     */
    cleanup(): void
}

const logName = 'KeyboardEventListener'
export const keyboardeventListenerToken = token<IKeyboardEventListener>(logName)
export const keyboardeventListenerDependencies: Token<unknown>[] = []
export class KeyboardEventListener implements IKeyboardEventListener {
    private key: number = 0
    private listeners: EventListener[] = []
    private boundOnKeyDown: (event: globalThis.KeyboardEvent) => void

    /**
     * Creates a new `KeyboardEventListener` and starts listening for
     * `keydown` events on the `document`.
     */
    constructor() {
        this.boundOnKeyDown = this.onKeyDown.bind(this)
        if (typeof document !== 'undefined') {
            document.addEventListener('keydown', this.boundOnKeyDown)
        }
    }

    /**
     * Removes the DOM `keydown` listener and clears any registered callbacks.
     */
    public cleanup() {
        if (typeof document !== 'undefined') {
            document.removeEventListener('keydown', this.boundOnKeyDown)
        }
        this.listeners = []
    }

    /**
     * Adds a listener that will be invoked for every keyboard event.
     *
     * @param listener Callback executed with normalized keyboard data.
     * @returns Cleanup function that unregisters the listener when called.
     */
    public addListener(listener: (event: KeyboardEvent) => void): CleanUp {
        const newListener: EventListener = {
            key: this.key++,
            listener: listener
        }
        this.listeners.push(newListener)

        return () => {
            this.listeners = this.listeners.filter(l => l.key !== newListener.key)
        }
    }

    private onKeyDown(event: globalThis.KeyboardEvent) {
        const keyboardEvent: KeyboardEvent = {
            code: event.code,
            alt: event.altKey,
            ctrl: event.ctrlKey,
            shift: event.shiftKey
        }
        this.listeners.forEach(l => l.listener(keyboardEvent))
    }
}
