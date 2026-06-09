import type { Action } from '@ancadeba/content'
import { newGameDefinitionProviderToken } from '../providers/definition/tokens'
import type { INewGameDefinitionProvider } from '../providers/definition/types'
import {
  gameSessionStorageToken,
  surfaceDataStorageToken,
} from '../storage/data/tokens'
import type {
  GameSession,
  IGameSessionStorage,
  ISurfaceDataStorage,
} from '../storage/data/types'
import { gameActionEnvironmentToken } from './tokens'
import type { IGameActionEnvironment, IGameActionExecutor } from './types'
import type { Token } from '@ancadeba/utils'

export const gameActionExecutorDependencies: Token<unknown>[] = [
  surfaceDataStorageToken,
  gameSessionStorageToken,
  newGameDefinitionProviderToken,
  gameActionEnvironmentToken,
]

export class GameActionExecutor implements IGameActionExecutor {
  constructor(
    private readonly surfaceDataStorage: ISurfaceDataStorage,
    private readonly gameSessionStorage: IGameSessionStorage,
    private readonly newGameDefinitionProvider: INewGameDefinitionProvider,
    private readonly environment: IGameActionEnvironment,
  ) {}

  async execute(action: Action): Promise<void> {
    switch (action.type) {
      case 'navigate':
        this.surfaceDataStorage.surfaceId = action.targetSurfaceId
        return
      case 'new-game':
        await this.startNewGame(action.newGameId)
        return
      case 'exit':
        this.environment.close()
        return
    }
  }

  private async startNewGame(newGameId: string): Promise<void> {
    const newGame = await this.newGameDefinitionProvider.getNewGameDefinition(
      newGameId,
    )
    const session: GameSession = {
      newGameId: newGame.id,
      mapId: newGame.mapId,
      player: {
        position: {
          row: newGame.player.position.row,
          column: newGame.player.position.column,
        },
      },
    }

    this.gameSessionStorage.session = session
    this.surfaceDataStorage.surfaceId = newGame.startSurfaceId
  }
}
