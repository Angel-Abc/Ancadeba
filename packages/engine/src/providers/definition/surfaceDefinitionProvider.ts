import { ILogger, loggerToken, Token } from '@ancadeba/utils'
import {
  gameDefinitionProviderToken,
  surfaceDefinitionProviderToken,
} from './tokens'
import { IGameDefinitionProvider, ISurfaceDefinitionProvider } from './types'
import { ISurfaceLoader, Surface, surfaceLoaderToken } from '@ancadeba/content'

export const surfaceDefinitionProviderDependencies: Token<unknown>[] = [
  loggerToken,
  gameDefinitionProviderToken,
  surfaceLoaderToken,
]
export class SurfaceDefinitionProvider implements ISurfaceDefinitionProvider {
  private surfaceCache: Map<string, Surface> = new Map()

  constructor(
    private readonly logger: ILogger,
    private readonly gameDefinitionProvider: IGameDefinitionProvider,
    private readonly surfaceLoader: ISurfaceLoader,
  ) {}

  async getSurfaceDefinition(surfaceId: string): Promise<Surface> {
    if (this.surfaceCache.has(surfaceId)) {
      return this.surfaceCache.get(surfaceId)!
    }
    const game = await this.gameDefinitionProvider.getGameDefinition()
    const surfacePath = game.surfaces[surfaceId]
    if (!surfacePath) {
      throw new Error(
        this.logger.error(
          surfaceDefinitionProviderToken,
          'Surface with ID {0} not found in game definition.',
          surfaceId,
        ),
      )
    }
    const surface = await this.surfaceLoader.loadSurface(surfacePath)
    this.surfaceCache.set(surfaceId, surface)
    return surface
  }
}
