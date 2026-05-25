import { ILogger, loggerToken, Token } from '@ancadeba/utils'
import {
  gameDefinitionProviderToken,
  tileSetDefinitionProviderToken,
} from './tokens'
import { IGameDefinitionProvider, ITileSetDefinitionProvider } from './types'
import {
  ITileSetLoader,
  TileSet,
  tileSetLoaderToken,
} from '@ancadeba/content'

export const tileSetDefinitionProviderDependencies: Token<unknown>[] = [
  loggerToken,
  gameDefinitionProviderToken,
  tileSetLoaderToken,
]

export class TileSetDefinitionProvider implements ITileSetDefinitionProvider {
  private tileSetCache: Map<string, TileSet> = new Map()

  constructor(
    private readonly logger: ILogger,
    private readonly gameDefinitionProvider: IGameDefinitionProvider,
    private readonly tileSetLoader: ITileSetLoader,
  ) {}

  async getTileSetDefinition(tileSetId: string): Promise<TileSet> {
    if (this.tileSetCache.has(tileSetId)) {
      return this.tileSetCache.get(tileSetId)!
    }

    const game = await this.gameDefinitionProvider.getGameDefinition()
    const tileSetPath = game.tileSets?.[tileSetId]

    if (!tileSetPath) {
      throw new Error(
        this.logger.error(
          tileSetDefinitionProviderToken,
          'Tile set with ID {0} not found in game definition.',
          tileSetId,
        ),
      )
    }

    const tileSet = await this.tileSetLoader.loadTileSet(tileSetPath)
    this.tileSetCache.set(tileSetId, tileSet)
    return tileSet
  }
}
