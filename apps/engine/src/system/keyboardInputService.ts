import {
  Token,
  token,
  IKeyboardListener,
  keyboardListenerToken,
} from '@ancadeba/utils'
import { UI_MESSAGES } from '../messages/ui'
import { IVirtualKeyMapper, virtualKeyMapperToken } from './virtualKeyMapper'
import { IEngineMessageBus, engineMessageBusToken } from './engineMessageBus'

export interface IKeyboardInputService {
  start(): void
  stop(): void
}

const logName = 'engine/system/keyboardInputService'
export const keyboardInputServiceToken = token<IKeyboardInputService>(logName)

export const keyboardInputServiceDependencies: Token<unknown>[] = [
  keyboardListenerToken,
  virtualKeyMapperToken,
  engineMessageBusToken,
]

export class KeyboardInputService implements IKeyboardInputService {
  private unsubscribe?: () => void

  constructor(
    private readonly keyboardListener: IKeyboardListener,
    private readonly virtualKeyMapper: IVirtualKeyMapper,
    private readonly messageBus: IEngineMessageBus
  ) {}

  start(): void {
    this.unsubscribe = this.keyboardListener.listen((event) => {
      const mapping = this.virtualKeyMapper.findMapping(event)

      if (mapping) {
        this.messageBus.publish(UI_MESSAGES.VIRTUAL_KEY_PRESSED, {
          virtualKey: mapping.virtualKey,
        })
      }
    })
  }

  stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  }
}
