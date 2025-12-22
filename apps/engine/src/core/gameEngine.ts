import { Token, token } from '@ancadeba/utils'
import {
  engineMessageBusToken,
  IEngineMessageBus,
} from '../system/engineMessageBus'
import { CORE_MESSAGES } from '../messages/core'
import { IUIReadySignal, uiReadySignalToken } from '../system/uiReadySignal'

export interface IGameEngine {
  start(): Promise<void>
}

const logName = 'engine/core/GameEngine'
export const gameEngineToken = token<IGameEngine>(logName)
export const gameEngineDependencies: Token<unknown>[] = [
  engineMessageBusToken,
  uiReadySignalToken,
]
export class GameEngine implements IGameEngine {
  constructor(
    private readonly messageBus: IEngineMessageBus,
    private readonly uiReadySignal: IUIReadySignal
  ) {}

  async start(): Promise<void> {
    // load game

    await this.uiReadySignal.ready
    this.messageBus.publish(CORE_MESSAGES.GAME_ENGINE_STARTED, undefined)
  }
}
