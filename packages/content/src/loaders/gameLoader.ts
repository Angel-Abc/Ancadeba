import { Token, loggerToken, ILogger, loadJsonResource } from '@ancadeba/utils'
import { IGameLoader } from './types'
import { Game, gameSchema } from '../schemas/game'
import { resourceConfigurationToken } from '../configuration/tokens'
import { IResourceConfiguration } from '../configuration/types'

export const gameLoaderDependencies: Token<unknown>[] = [
  loggerToken,
  resourceConfigurationToken,
]
export class GameLoader implements IGameLoader {
  constructor(
    private readonly logger: ILogger,
    private readonly resourceConfiguration: IResourceConfiguration,
  ) {}

  async loadGame(): Promise<Game> {
    const path = `${this.resourceConfiguration.resourcePath}/game.json`
    return loadJsonResource<Game>(path, gameSchema, this.logger)
  }
}
