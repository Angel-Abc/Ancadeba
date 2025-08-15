import { Token, token } from '@ioc/token'
import { CleanUp } from '@utils/types'

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

export interface IKeyboardEventListener {
    addListener(listener: (event: KeyboardEvent) => void): CleanUp
    cleanup(): void
}

const logName = 'KeyboardEventListener'
export const keyboardeventListenerToken = token<IKeyboardEventListener>(logName)
export const keyboardeventListenerDependencies: Token<unknown>[] = []
export class KeyboardEventListener implements IKeyboardEventListener {
    private key: number = 0
    private listeners: EventListener[] = []

    constructor() {
        document.addEventListener('keydown', this.onKeyDown.bind(this))
    }

    public cleanup() {
        document.removeEventListener('keydown', this.onKeyDown)
    }

    public addListener(listener: (event: KeyboardEvent) => void): CleanUp {
        const newListener: EventListener = {
            key: this.key++,
            listener: listener
        }
        this.listeners.push(newListener)

        return () => {
            this.listeners.filter(l => l.key !== newListener.key)
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
