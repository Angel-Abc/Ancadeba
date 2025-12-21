import {
  ILogger,
  loggerToken,
  Token,
  token,
  loadJsonResource,
} from '@ancadeba/utils'
import { GameData } from './types'
import { IJsonConfiguration, jsonConfigurationToken } from './configuration'
import { Game, gameSchema } from '../schemas/game'

export interface IGameDataLoader {
  loadGameData(): Promise<GameData>
}

const logName = 'schemas/loaders/gameDataLoader'
export const gameDataLoaderToken = token<IGameDataLoader>(logName)
export const gameDataLoaderDependencies: Token<unknown>[] = [
  loggerToken,
  jsonConfigurationToken,
]
export class GameDataLoader implements IGameDataLoader {
  constructor(
    private readonly logger: ILogger,
    private readonly config: IJsonConfiguration
  ) {}

  async loadGameData(): Promise<GameData> {
    const result = {
      meta: await loadJsonResource<Game>(
        `${this.config.rootPath}/game.json`,
        gameSchema,
        this.logger
      ),
    }
    this.logger.debug(logName, 'Loaded game data: {0}', result)
    return result
  }
}
