import type { Action } from '@ancadeba/content'
import { surfaceDataStorageToken } from '../storage/data/tokens'
import type { ISurfaceDataStorage } from '../storage/data/types'
import { gameActionEnvironmentToken } from './tokens'
import type { IGameActionEnvironment, IGameActionExecutor } from './types'
import type { Token } from '@ancadeba/utils'

export const gameActionExecutorDependencies: Token<unknown>[] = [
  surfaceDataStorageToken,
  gameActionEnvironmentToken,
]

export class GameActionExecutor implements IGameActionExecutor {
  constructor(
    private readonly surfaceDataStorage: ISurfaceDataStorage,
    private readonly environment: IGameActionEnvironment,
  ) {}

  execute(action: Action): void {
    switch (action.type) {
      case 'navigate':
        this.surfaceDataStorage.surfaceId = action.targetSurfaceId
        return
      case 'exit':
        this.environment.close()
        return
    }
  }
}
