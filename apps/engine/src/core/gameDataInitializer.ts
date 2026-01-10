import { Token, token, typedEntries } from '@ancadeba/utils'
import type { GameData, Tile } from '@ancadeba/schemas'
import {
  gameStateStorageToken,
  IGameStateMutator,
} from '../gameState.ts/storage'
import {
  IResourceDataStorage,
  resourceDataStorageToken,
} from '../resourceData/storage'
import { ISettingsStorage, settingsStorageToken } from '../settings/storage'
import { ILanguageStorage, languageStorageToken } from '../language/storage'

export interface IGameDataInitializer {
  initialize(gameData: GameData): Promise<void>
}

const logName = 'engine/core/gameDataInitializer'
export const gameDataInitializerToken = token<IGameDataInitializer>(logName)
export const gameDataInitializerDependencies: Token<unknown>[] = [
  gameStateStorageToken,
  resourceDataStorageToken,
  settingsStorageToken,
  languageStorageToken,
]

export class GameDataInitializer implements IGameDataInitializer {
  constructor(
    private readonly gameStateStorage: IGameStateMutator,
    private readonly resourceDataStorage: IResourceDataStorage,
    private readonly settingsStorage: ISettingsStorage,
    private readonly languageStorage: ILanguageStorage
  ) {}

  async initialize(gameData: GameData): Promise<void> {
    const { scene: initialScene, ...initialState } = gameData.meta.initialState

    this.settingsStorage.setDefaultSettings(gameData.meta.defaultSettings)

    this.gameStateStorage.state = {
      title: gameData.meta.title,
      activeSceneId: initialScene,
      activeMapId: gameData.meta.initialState.map || null,
      flags: {},
      sceneStack: [initialScene],
      ...initialState,
    }

    typedEntries(gameData.meta.languages).forEach(([key, language]) => {
      this.resourceDataStorage.setLanguageFileNames(key, language.files)
    })

    gameData.scenes.forEach((scene) => {
      this.resourceDataStorage.addSceneData(scene.id, scene)
    })
    gameData.meta.styling?.forEach((fileName) => {
      this.resourceDataStorage.addCssFileName(fileName)
    })
    gameData.tileSets.forEach((tileSet) => {
      tileSet.tiles.forEach((tile) => {
        const tileId = `${tileSet.id}.${tile.id}`
        this.resourceDataStorage.addTileData(tileId, tile)
      })
    })
    gameData.maps.forEach((map) => {
      this.resourceDataStorage.addMapData(map.id, {
        id: map.id,
        width: map.width,
        height: map.height,
        tiles: new Map<string, Tile>(
          map.tiles.map((tile) => [
            tile.key,
            this.resourceDataStorage.getTileData(tile.tile),
          ])
        ),
        squares: map.map.map((row) => row.split(',')),
      })
    })

    await this.languageStorage.setLanguage(
      gameData.meta.defaultSettings.language
    )

    this.resourceDataStorage.logResourceData()
  }
}
