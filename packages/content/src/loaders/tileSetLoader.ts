import { ILogger, loadJsonResource, loggerToken, Token } from '@ancadeba/utils'
import { resourceConfigurationToken } from '../configuration/tokens'
import { ITileSetLoader } from './types'
import { IResourceConfiguration } from '../configuration/types'
import { TileSet, tileSetSchema } from '../schemas/tileSet'

export const tileSetLoaderDependencies: Token<unknown>[] = [
  loggerToken,
  resourceConfigurationToken,
]

export class TileSetLoader implements ITileSetLoader {
  constructor(
    private readonly logger: ILogger,
    private readonly resourceConfiguration: IResourceConfiguration,
  ) {}

  async loadTileSet(tileSetPath: string): Promise<TileSet> {
    const path = `${this.resourceConfiguration.resourcePath}/${tileSetPath}`
    return loadJsonResource<TileSet>(path, tileSetSchema, this.logger)
  }
}
