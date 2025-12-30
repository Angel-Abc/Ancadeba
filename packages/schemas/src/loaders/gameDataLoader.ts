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
import { ZodTypeAny } from 'zod'
import { tileSetSchema } from '../schemas/tileSet'

export interface IGameDataLoader {
  loadGameData(): Promise<GameData>
}

type GameDataCollections = Omit<GameData, 'meta'>
type GameDataCollectionKey = keyof GameDataCollections

type ResourceCollectionDefinition = {
  names: readonly string[]
  basePath: string
  schema: ZodTypeAny
}

type ResourceCollectionDefinitions = Record<
  GameDataCollectionKey,
  ResourceCollectionDefinition
>

export type ResourceCollectionFactory = (
  game: Game,
  rootPath: string
) => ResourceCollectionDefinitions

const defaultResourceCollectionFactory: ResourceCollectionFactory = (
  game,
  rootPath
) => ({
  scenes: {
    names: game.scenes,
    basePath: `${rootPath}/scenes`,
    schema: sceneSchema,
  },
  tileSets: {
    names: game.tileSets,
    basePath: `${rootPath}/tileSets`,
    schema: tileSetSchema,
  },
})

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
    definitions: ResourceCollectionDefinitions
  ): Promise<GameDataCollections> {
    const collections = {} as Record<GameDataCollectionKey, unknown[]>

    await Promise.all(
      Object.entries(definitions).map(async ([key, definition]) => {
        const items = await this.loadNamedResources(
          definition.names,
          definition.basePath,
          definition.schema
        )
        collections[key as GameDataCollectionKey] = items
      })
    )

    return collections as GameDataCollections
  }

  private async loadNamedResources(
    names: readonly string[],
    basePath: string,
    schema: ZodTypeAny
  ): Promise<unknown[]> {
    return Promise.all(
      names.map((name) =>
        loadJsonResource(`${basePath}/${name}.json`, schema, this.logger)
      )
    )
  }
}
