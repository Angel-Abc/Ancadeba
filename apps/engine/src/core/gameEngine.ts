import { Token, token } from '@ancadeba/utils'
import {
  engineMessageBusToken,
  IEngineMessageBus,
} from '../system/engineMessageBus'
import { CORE_MESSAGES } from '../messages/core'

export interface IGameEngine {
  start(): Promise<void>
}

const logName = 'engine/core/GameEngine'
export const gameEngineToken = token<IGameEngine>(logName)
export const gameEngineDependencies: Token<unknown>[] = [engineMessageBusToken]
export class GameEngine implements IGameEngine {
  constructor(private readonly messageBus: IEngineMessageBus) {}

  async start(): Promise<void> {
    this.messageBus.publish(CORE_MESSAGES.GAME_ENGINE_STARTED, undefined)
    // Game engine starting logic goes here
  }
}
