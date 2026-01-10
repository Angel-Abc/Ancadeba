import { Token, token } from '@ancadeba/utils'
import { UI_MESSAGES } from '../messages/ui'
import {
  IResourceDataStorage,
  resourceDataStorageToken,
} from '../resourceData/storage'
import { IEngineMessageBus, engineMessageBusToken } from './engineMessageBus'

export interface IVirtualInputService {
  start(): void
  stop(): void
}

const logName = 'engine/system/virtualInputService'
export const virtualInputServiceToken = token<IVirtualInputService>(logName)

export const virtualInputServiceDependencies: Token<unknown>[] = [
  resourceDataStorageToken,
  engineMessageBusToken,
]

export class VirtualInputService implements IVirtualInputService {
  private unsubscribe?: () => void

  constructor(
    private readonly resourceDataStorage: IResourceDataStorage,
    private readonly messageBus: IEngineMessageBus
  ) {}

  start(): void {
    this.unsubscribe = this.messageBus.subscribe(
      UI_MESSAGES.VIRTUAL_KEY_PRESSED,
      (payload) => {
        const virtualInputs = this.resourceDataStorage.getVirtualInputs()
        const mapping = virtualInputs.find((m) =>
          m.virtualKeys.includes(payload.virtualKey)
        )

        if (mapping) {
          this.messageBus.publish(UI_MESSAGES.VIRTUAL_INPUT_PRESSED, {
            virtualInput: mapping.virtualInput,
            label: mapping.label,
          })
        }
      }
    )
  }

  stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  }
}
