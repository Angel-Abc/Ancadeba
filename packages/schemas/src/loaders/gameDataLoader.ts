import {
  ILogger,
  loggerToken,
  Token,
  token,
  loadJsonResource,
  typedEntries,
  typedKeys,
} from '@ancadeba/utils'
import { GameData } from './types'
import { IJsonConfiguration, jsonConfigurationToken } from './configuration'
import { Game, gameSchema } from '../schemas/game'
import { sceneSchema } from '../schemas/scene'
import { ZodTypeAny } from 'zod'
import { tileSetSchema } from '../schemas/tileSet'
import { mapSchema } from '../schemas/map'
import { itemSchema } from '../schemas/item'
import { appearanceCategorySchema } from '../schemas/appearanceCategory'
import { appearanceSchema } from '../schemas/appearance'
import { Language, languageSchema } from '../schemas/language'
import { VirtualKeys, virtualKeysSchema } from '../schemas/virtualKeys'
import { VirtualInputs, virtualInputsSchema } from '../schemas/virtualInputs'

export interface IGameDataLoader {
  loadGameData(): Promise<GameData>
  loadLanguageData(languageFilePaths: string[]): Promise<Map<string, string>>
}

type GameDataCollections = Omit<
  GameData,
  'meta' | 'languages' | 'virtualKeys' | 'virtualInputs'
>
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
  maps: {
    names: game.maps,
    basePath: `${rootPath}/maps`,
    schema: mapSchema,
  },
  items: {
    names: game.items,
    basePath: `${rootPath}/items`,
    schema: itemSchema,
  },
  appearanceCategories: {
    names: game.appearanceCategories,
    basePath: rootPath,
    schema: appearanceCategorySchema,
  },
  appearances: {
    names: game.appearances,
    basePath: rootPath,
    schema: appearanceSchema,
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

    const languages = new Map<string, { name: string; files: string[] }>()
    for (const langKey of typedKeys(game.languages)) {
      const langDef = game.languages[langKey]
      if (!langDef) continue
      languages.set(langKey, { name: langDef.name, files: langDef.files })
    }

    const virtualKeys = await loadJsonResource<VirtualKeys>(
      `${this.config.rootPath}/input/${game.virtualKeys}.json`,
      virtualKeysSchema,
      this.logger
    )

    const virtualInputs = await loadJsonResource<VirtualInputs>(
      `${this.config.rootPath}/input/${game.virtualInputs}.json`,
      virtualInputsSchema,
      this.logger
    )

    const result: GameData = {
      meta: game,
      languages: languages,
      ...collections,
      virtualKeys: virtualKeys,
      virtualInputs: virtualInputs,
    }
    this.logger.debug(logName, 'Loaded game data: {0}', result)
    return result
  }

  async loadLanguageData(
    languageFilePaths: string[]
  ): Promise<Map<string, string>> {
    const translations = new Map<string, string>()

    await Promise.all(
      languageFilePaths.map(async (filePath) => {
        const fileTranslations = await loadJsonResource<Language>(
          filePath,
          languageSchema,
          this.logger
        )
        for (const [key, value] of Object.entries(
          fileTranslations.translations
        )) {
          translations.set(key, value)
        }
      })
    )
    return translations
  }

  private async loadCollections(
    definitions: ResourceCollectionDefinitions
  ): Promise<GameDataCollections> {
    const entries = await Promise.all(
      typedEntries(definitions).map(async ([key, definition]) => {
        const items = await this.loadNamedResources(
          definition.names,
          definition.basePath,
          definition.schema
        )
        return [key, items] as const
      })
    )

    return Object.fromEntries(entries) as GameDataCollections
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
