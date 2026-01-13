import { ILogger, loggerToken, Token, token } from '@ancadeba/utils'
import { CORE_MESSAGES } from '../messages/core'
import {
  engineMessageBusToken,
  IEngineMessageBus,
} from '../system/engineMessageBus'
import {
  gameStateReaderToken,
  gameStateMutatorToken,
  flagStorageToken,
  IFlagStorage,
  IGameStateMutator,
  IGameStateReader,
} from './storage'

export interface IGameStateManager {
  switchScene(sceneId: string): void
  goBack(): void
  setFlag(flagName: string, value: boolean): void
}

const logName = 'engine/gameState/manager'
export const gameStateManagerToken = token<IGameStateManager>(logName)
export const gameStateManagerDependencies: Token<unknown>[] = [
  loggerToken,
  engineMessageBusToken,
  gameStateReaderToken,
  gameStateMutatorToken,
  flagStorageToken,
]

export class GameStateManager implements IGameStateManager {
  constructor(
    private readonly logger: ILogger,
    private readonly messageBus: IEngineMessageBus,
    private readonly gameStateReader: IGameStateReader,
    private readonly gameStateMutator: IGameStateMutator,
    private readonly flagStorage: IFlagStorage
  ) {}

  switchScene(sceneId: string): void {
    const sceneStack = this.gameStateReader.state.sceneStack
    this.gameStateMutator.update({
      activeSceneId: sceneId,
      sceneStack: [...sceneStack, sceneId],
    })
    this.messageBus.publish(CORE_MESSAGES.SCENE_CHANGED, { sceneId })
  }

  goBack(): void {
    const sceneStack = this.gameStateReader.state.sceneStack
    if (sceneStack.length <= 1) {
      this.logger.warn(logName, 'Cannot go back, scene stack is empty')
      return
    }
    const newSceneStack = sceneStack.slice(0, -1)
    const previousSceneId = newSceneStack[newSceneStack.length - 1]
    if (previousSceneId === undefined) {
      this.logger.warn(logName, 'Cannot go back, scene stack is empty')
      return
    }
    this.gameStateMutator.update({
      activeSceneId: previousSceneId,
      sceneStack: newSceneStack,
    })
    this.messageBus.publish(CORE_MESSAGES.SCENE_CHANGED, {
      sceneId: previousSceneId,
    })
  }

  setFlag(flagName: string, value: boolean): void {
    this.flagStorage.setFlag(flagName, value)
  }
}
