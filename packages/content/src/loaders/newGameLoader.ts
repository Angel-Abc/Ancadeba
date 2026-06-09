import { ILogger, loadJsonResource, loggerToken, Token } from '@ancadeba/utils'
import { resourceConfigurationToken } from '../configuration/tokens'
import { INewGameLoader } from './types'
import { IResourceConfiguration } from '../configuration/types'
import { NewGame, newGameSchema } from '../schemas/newGame'

export const newGameLoaderDependencies: Token<unknown>[] = [
  loggerToken,
  resourceConfigurationToken,
]

export class NewGameLoader implements INewGameLoader {
  constructor(
    private readonly logger: ILogger,
    private readonly resourceConfiguration: IResourceConfiguration,
  ) {}

  async loadNewGame(newGamePath: string): Promise<NewGame> {
    const path = `${this.resourceConfiguration.resourcePath}/${newGamePath}`
    return loadJsonResource<NewGame>(path, newGameSchema, this.logger)
  }
}
