import {
  Token,
  token,
  IKeyboardListener,
  keyboardListenerToken,
} from '@ancadeba/utils'
import { UI_MESSAGES } from '../messages/ui'
import {
  IResourceDataStorage,
  resourceDataStorageToken,
} from '../resourceData/storage'
import { IEngineMessageBus, engineMessageBusToken } from './engineMessageBus'

export interface IKeyboardInputService {
  start(): void
  stop(): void
}

const logName = 'engine/system/keyboardInputService'
export const keyboardInputServiceToken = token<IKeyboardInputService>(logName)

export const keyboardInputServiceDependencies: Token<unknown>[] = [
  keyboardListenerToken,
  resourceDataStorageToken,
  engineMessageBusToken,
]

export class KeyboardInputService implements IKeyboardInputService {
  private unsubscribe?: () => void

  constructor(
    private readonly keyboardListener: IKeyboardListener,
    private readonly resourceDataStorage: IResourceDataStorage,
    private readonly messageBus: IEngineMessageBus
  ) {}

  start(): void {
    this.unsubscribe = this.keyboardListener.listen((event) => {
      const virtualKeys = this.resourceDataStorage.getVirtualKeys()
      const mapping = virtualKeys.find(
        (m) =>
          m.code === event.code &&
          m.shift === event.shift &&
          m.ctrl === event.ctrl &&
          m.alt === event.alt
      )

      if (mapping) {
        this.messageBus.publish(UI_MESSAGES.VIRTUAL_KEY_PRESSED, {
          virtualKey: mapping.virtualKey,
        })
      }
    })

    this.keyboardListener.start()
  }

  stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  }
}
