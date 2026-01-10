import { Token, token, typedEntries } from '@ancadeba/utils'
import type { GameData } from '@ancadeba/schemas'
import {
  gameStateMutatorToken,
  IGameStateMutator,
} from '../../gameState.ts/storage'
import { ISettingsStorage, settingsStorageToken } from '../../settings/storage'
import { ILanguageStorage, languageStorageToken } from '../../language/storage'
import {
  ILanguageFileStorage,
  languageFileStorageToken,
} from '../../resourceData/storage'

export interface IGameStateInitializer {
  initializeGameState(gameData: GameData): Promise<void>
}

const logName = 'engine/core/initializers/gameStateInitializer'
export const gameStateInitializerToken = token<IGameStateInitializer>(logName)
export const gameStateInitializerDependencies: Token<unknown>[] = [
  gameStateMutatorToken,
  settingsStorageToken,
  languageStorageToken,
  languageFileStorageToken,
]

export class GameStateInitializer implements IGameStateInitializer {
  constructor(
    private readonly gameStateStorage: IGameStateMutator,
    private readonly settingsStorage: ISettingsStorage,
    private readonly languageStorage: ILanguageStorage,
    private readonly languageFileStorage: ILanguageFileStorage
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
      this.languageFileStorage.setLanguageFileNames(key, language.files)
    })

    await this.languageStorage.setLanguage(
      gameData.meta.defaultSettings.language
    )
  }
}
