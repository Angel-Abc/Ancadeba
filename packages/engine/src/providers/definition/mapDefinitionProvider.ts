import { ILogger, loggerToken, Token } from '@ancadeba/utils'
import {
  gameDefinitionProviderToken,
  mapDefinitionProviderToken,
} from './tokens'
import { IGameDefinitionProvider, IMapDefinitionProvider } from './types'
import { GameMap, IMapLoader, mapLoaderToken } from '@ancadeba/content'

export const mapDefinitionProviderDependencies: Token<unknown>[] = [
  loggerToken,
  gameDefinitionProviderToken,
  mapLoaderToken,
]

export class MapDefinitionProvider implements IMapDefinitionProvider {
  private mapCache: Map<string, GameMap> = new Map()

  constructor(
    private readonly logger: ILogger,
    private readonly gameDefinitionProvider: IGameDefinitionProvider,
    private readonly mapLoader: IMapLoader,
  ) {}

  async getMapDefinition(mapId: string): Promise<GameMap> {
    if (this.mapCache.has(mapId)) {
      return this.mapCache.get(mapId)!
    }

    const game = await this.gameDefinitionProvider.getGameDefinition()
    const mapPath = game.maps?.[mapId]

    if (!mapPath) {
      throw new Error(
        this.logger.error(
          mapDefinitionProviderToken,
          'Map with ID {0} not found in game definition.',
          mapId,
        ),
      )
    }

    const map = await this.mapLoader.loadMap(mapPath)
    this.mapCache.set(mapId, map)
    return map
  }
}
