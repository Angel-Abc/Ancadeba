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
import { sceneSchema } from '../schemas/scene'
import { ZodType } from 'zod'

export interface IGameDataLoader {
  loadGameData(): Promise<GameData>
}

type GameDataCollections = Omit<GameData, 'meta'>
type GameDataCollectionKey = keyof GameDataCollections

type ResourceCollectionDefinition<T> = {
  key: GameDataCollectionKey
  names: readonly string[]
  basePath: string
  schema: ZodType<T>
}

export type ResourceCollectionFactory = (
  game: Game,
  rootPath: string
) => ResourceCollectionDefinition<unknown>[]

const defaultResourceCollectionFactory: ResourceCollectionFactory = (
  game,
  rootPath
) => [
  {
    key: 'scenes',
    names: game.scenes,
    basePath: `${rootPath}/scenes`,
    schema: sceneSchema,
  },
]

const logName = 'schemas/loaders/gameDataLoader'
export const gameDataLoaderToken = token<IGameDataLoader>(logName)
export const gameDataLoaderDependencies: Token<unknown>[] = [
  loggerToken,
  jsonConfigurationToken,
]
export class GameDataLoader implements IGameDataLoader {
  constructor(
    private readonly logger: ILogger,
    private readonly config: IJsonConfiguration,
    private readonly resourceCollectionFactory: ResourceCollectionFactory = defaultResourceCollectionFactory
  ) {}

  async loadGameData(): Promise<GameData> {
    const game = await loadJsonResource<Game>(
      `${this.config.rootPath}/game.json`,
      gameSchema,
      this.logger
    )
    const collections = await this.loadCollections(
      this.resourceCollectionFactory(game, this.config.rootPath)
    )

    const result = {
      meta: game,
      ...collections,
    }
    this.logger.debug(logName, 'Loaded game data: {0}', result)
    return result
  }

  private async loadCollections(
    definitions: ResourceCollectionDefinition<unknown>[]
  ): Promise<GameDataCollections> {
    const collections = {} as GameDataCollections

    await Promise.all(
      definitions.map(async (definition) => {
        const items = await this.loadNamedResources(
          definition.names,
          definition.basePath,
          definition.schema
        )
        collections[definition.key] =
          items as GameDataCollections[typeof definition.key]
      })
    )

    return collections
  }

  private async loadNamedResources<T>(
    names: readonly string[],
    basePath: string,
    schema: ZodType<T>
  ): Promise<T[]> {
    return Promise.all(
      names.map((name) =>
        loadJsonResource<T>(`${basePath}/${name}.json`, schema, this.logger)
      )
    )
  }
}
