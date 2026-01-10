import { Token, token } from '../ioc/token'
import { ILogger, loggerToken } from '../logger/types'

export interface KeyboardEvent {
  code: string
  alt: boolean
  shift: boolean
  ctrl: boolean
}

export interface IKeyboardListener {
  listen(callback: (event: KeyboardEvent) => void): () => void
  start(): void
}

const logName = 'utils/keyboard/KeyboardListener'
export const keyboardListenerToken = token<IKeyboardListener>(logName)
export const keyboardListenerDependencies: Token<unknown>[] = [loggerToken]

export class KeyboardListener implements IKeyboardListener {
  private readonly callbacks: Set<(event: KeyboardEvent) => void> = new Set()
  private isStarted = false

  constructor(private readonly logger: ILogger) {}

  listen(callback: (event: KeyboardEvent) => void): () => void {
    this.callbacks.add(callback)
    this.logger.debug(
      logName,
      'Registered keyboard listener. Total listeners: {0}',
      this.callbacks.size
    )
    return () => {
      this.callbacks.delete(callback)
      this.logger.debug(
        logName,
        'Unregistered keyboard listener. Total listeners: {0}',
        this.callbacks.size
      )
    }
  }

  start(): void {
    if (this.isStarted) {
      this.logger.warn(logName, 'Keyboard listener already started')
      return
    }

    this.isStarted = true
    this.logger.info(logName, 'Starting keyboard listener')

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown)
    }
  }

  private handleKeyDown = (nativeEvent: globalThis.KeyboardEvent): void => {
    const event: KeyboardEvent = {
      code: nativeEvent.code,
      alt: nativeEvent.altKey,
      shift: nativeEvent.shiftKey,
      ctrl: nativeEvent.ctrlKey,
    }

    this.logger.debug(logName, 'Keyboard event: {0}', event.code)

    for (const callback of this.callbacks) {
      callback(event)
    }
  }
}
