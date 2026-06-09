import { ILogger, loggerToken, Token } from '@ancadeba/utils'
import {
  gameDefinitionProviderToken,
  newGameDefinitionProviderToken,
} from './tokens'
import { IGameDefinitionProvider, INewGameDefinitionProvider } from './types'
import { INewGameLoader, NewGame, newGameLoaderToken } from '@ancadeba/content'

export const newGameDefinitionProviderDependencies: Token<unknown>[] = [
  loggerToken,
  gameDefinitionProviderToken,
  newGameLoaderToken,
]

export class NewGameDefinitionProvider implements INewGameDefinitionProvider {
  private newGameCache: Map<string, NewGame> = new Map()

  constructor(
    private readonly logger: ILogger,
    private readonly gameDefinitionProvider: IGameDefinitionProvider,
    private readonly newGameLoader: INewGameLoader,
  ) {}

  async getNewGameDefinition(newGameId: string): Promise<NewGame> {
    if (this.newGameCache.has(newGameId)) {
      return this.newGameCache.get(newGameId)!
    }

    const game = await this.gameDefinitionProvider.getGameDefinition()
    const newGamePath = game.newGames?.[newGameId]

    if (!newGamePath) {
      throw new Error(
        this.logger.error(
          newGameDefinitionProviderToken,
          'New game with ID {0} not found in game definition.',
          newGameId,
        ),
      )
    }

    const newGame = await this.newGameLoader.loadNewGame(newGamePath)
    this.newGameCache.set(newGameId, newGame)
    return newGame
  }
}
