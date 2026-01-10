import { Token, token, typedEntries } from '@ancadeba/utils'
import type { GameData } from '@ancadeba/schemas'
import {
  gameStateStorageToken,
  IGameStateMutator,
} from '../../gameState.ts/storage'
import { ISettingsStorage, settingsStorageToken } from '../../settings/storage'
import { ILanguageStorage, languageStorageToken } from '../../language/storage'
import {
  IResourceDataStorage,
  resourceDataStorageToken,
} from '../../resourceData/storage'

export interface IGameStateInitializer {
  initializeGameState(gameData: GameData): Promise<void>
}

const logName = 'engine/core/initializers/gameStateInitializer'
export const gameStateInitializerToken = token<IGameStateInitializer>(logName)
export const gameStateInitializerDependencies: Token<unknown>[] = [
  gameStateStorageToken,
  settingsStorageToken,
  languageStorageToken,
  resourceDataStorageToken,
]

export class GameStateInitializer implements IGameStateInitializer {
  constructor(
    private readonly gameStateStorage: IGameStateMutator,
    private readonly settingsStorage: ISettingsStorage,
    private readonly languageStorage: ILanguageStorage,
    private readonly resourceDataStorage: IResourceDataStorage
  ) {}

  async initializeGameState(gameData: GameData): Promise<void> {
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

    await this.languageStorage.setLanguage(
      gameData.meta.defaultSettings.language
    )
  }
}
