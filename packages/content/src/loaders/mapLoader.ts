import { ILogger, loadJsonResource, loggerToken, Token } from '@ancadeba/utils'
import { resourceConfigurationToken } from '../configuration/tokens'
import { IMapLoader } from './types'
import { IResourceConfiguration } from '../configuration/types'
import { GameMap, mapSchema } from '../schemas/map'

export const mapLoaderDependencies: Token<unknown>[] = [
  loggerToken,
  resourceConfigurationToken,
]

export class MapLoader implements IMapLoader {
  constructor(
    private readonly logger: ILogger,
    private readonly resourceConfiguration: IResourceConfiguration,
  ) {}

  async loadMap(mapPath: string): Promise<GameMap> {
    const path = `${this.resourceConfiguration.resourcePath}/${mapPath}`
    return loadJsonResource<GameMap>(path, mapSchema, this.logger)
  }
}
