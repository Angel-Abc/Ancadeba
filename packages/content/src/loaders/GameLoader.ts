import { loggerToken, type ILogger, type Token } from '@ancadeba/utils'
import { gameSchema, type Game } from '../schemas/game'
import { resourcesConfigurationToken } from '../configuration/tokens'
import type { IResourcesConfiguration } from '../configuration/types'
import { GameLoaderLogName, type IGameLoader } from './types'

export const gameLoaderDependencies: Token<unknown>[] = [
  loggerToken,
  resourcesConfigurationToken,
]

export class GameLoader implements IGameLoader {
  public static readonly logName: string = GameLoaderLogName

  constructor(
    private readonly logger: ILogger,
    private readonly resourcesConfiguration: IResourcesConfiguration,
  ) {}

  async load(): Promise<Game> {
    const baseUrl = this.resourcesConfiguration.getResourcesPath()
    this.logger.debug(
      GameLoader.logName,
      'Loading game metadata from {0}',
      baseUrl,
    )

    const response = await fetch(`${baseUrl}/index.json`)

    if (!response.ok) {
      throw new Error(`Failed to load game metadata: ${response.status}`)
    }

    const data = await response.json()
    const parsed = gameSchema.parse(data)

    this.logger.debug(GameLoader.logName, 'Game metadata loaded: {0}', parsed)
    return parsed
  }
}
