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
import { Scene, sceneSchema } from '../schemas/scene'
import { ZodType } from 'zod'

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
    const game = await loadJsonResource<Game>(
      `${this.config.rootPath}/game.json`,
      gameSchema,
      this.logger
    )
    const [scenes] = await Promise.all([
      this.loadNamedResources<Scene>(
        game.scenes,
        `${this.config.rootPath}/scenes`,
        sceneSchema,
        this.logger
      ),
    ])

    const result = {
      meta: game,
      scenes: scenes,
    }
    this.logger.debug(logName, 'Loaded game data: {0}', result)
    return result
  }

  async loadNamedResources<T>(
    names: readonly string[],
    basePath: string,
    schema: ZodType<T>,
    logger: ILogger
  ): Promise<T[]> {
    return Promise.all(
      names.map((name) =>
        loadJsonResource<T>(`${basePath}/${name}.json`, schema, logger)
      )
    )
  }
}
