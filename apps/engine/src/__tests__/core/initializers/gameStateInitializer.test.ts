import { describe, expect, it, vi } from 'vitest'
import type { GameData } from '@ancadeba/schemas'
import type { IGameStateMutator } from '../../../gameState.ts/storage'
import type { GameState } from '../../../gameState.ts/types'
import type { ISettingsStorage } from '../../../settings/storage'
import type { ILanguageStorage } from '../../../language/storage'
import type { ILanguageFileStorage } from '../../../resourceData/storage'
import { GameStateInitializer } from '../../../core/initializers/gameStateInitializer'

describe('core/initializers/gameStateInitializer', () => {
  const createMockGameStateMutator = (): IGameStateMutator => {
    let storedState: GameState = {
      title: '',
      activeSceneId: '',
      activeMapId: null,
      flags: {},
      sceneStack: [],
    }

    return {
      update: vi.fn((value) => {
        storedState = { ...storedState, ...value }
      }),
      get state(): GameState {
        return storedState
      },
      set state(value: GameState) {
        storedState = value
      },
    }
  }

  const createMockSettingsStorage = (): ISettingsStorage => {
    let language = 'en'
    let volume = 0.5

    return {
      setDefaultSettings: vi.fn(),
      get language() {
        return language
      },
      get volume() {
        return volume
      },
      set language(value: string) {
        language = value
      },
      set volume(value: number) {
        volume = value
      },
    }
  }

  const createMockLanguageStorage = (): ILanguageStorage => ({
    setLanguage: vi.fn().mockResolvedValue(undefined),
    getTranslation: vi.fn(),
  })

  const createMockLanguageFileStorage = (): ILanguageFileStorage => ({
    getLanguageFileNames: vi.fn(() => []),
    setLanguageFileNames: vi.fn(),
  })

  const baseTimestamp = '2026-01-10T00:00:00Z'

  const createLanguageMap = (
    languages: GameData['meta']['languages']
  ): GameData['languages'] =>
    new Map(Object.entries(languages).map(([key, value]) => [key, value]))

  const createMinimalGameData = (): GameData => ({
    meta: {
      id: 'test-game',
      createdAt: baseTimestamp,
      updatedAt: baseTimestamp,
      title: 'Test Game',
      description: 'Test game description',
      version: '0.0.0',
      defaultSettings: {
        language: 'en',
        volume: 0.5,
      },
      languages: {
        en: {
          name: 'English',
          files: ['system.json'],
        },
      },
      initialState: {
        scene: 'start-scene',
      },
      scenes: [],
      styling: [],
      tileSets: [],
      maps: [],
      items: [],
      componentDefinitions: [],
      appearanceCategories: [],
      appearances: [],
      virtualKeys: 'virtual-keys',
      virtualInputs: 'virtual-inputs',
    },
    languages: createLanguageMap({
      en: {
        name: 'English',
        files: ['system.json'],
      },
    }),
    scenes: [],
    maps: [],
    tileSets: [],
    items: [],
    componentDefinitions: [],
    appearanceCategories: [],
    appearances: [],
    virtualKeys: {
      id: 'virtual-keys',
      createdAt: baseTimestamp,
      updatedAt: baseTimestamp,
      mappings: [],
    },
    virtualInputs: {
      id: 'virtual-inputs',
      createdAt: baseTimestamp,
      updatedAt: baseTimestamp,
      mappings: [],
    },
  })

  it('sets default settings correctly', async () => {
    // Arrange
    const gameStateMutator = createMockGameStateMutator()
    const settingsStorage = createMockSettingsStorage()
    const languageStorage = createMockLanguageStorage()
    const languageFileStorage = createMockLanguageFileStorage()
    const initializer = new GameStateInitializer(
      gameStateMutator,
      settingsStorage,
      languageStorage,
      languageFileStorage
    )
    const gameData = createMinimalGameData()

    // Act
    await initializer.initializeGameState(gameData)

    // Assert
    expect(settingsStorage.setDefaultSettings).toHaveBeenCalledTimes(1)
    expect(settingsStorage.setDefaultSettings).toHaveBeenCalledWith({
      language: 'en',
      volume: 0.5,
    })
  })

  it('initializes game state with title, activeSceneId, activeMapId', async () => {
    // Arrange
    const gameStateMutator = createMockGameStateMutator()
    const settingsStorage = createMockSettingsStorage()
    const languageStorage = createMockLanguageStorage()
    const languageFileStorage = createMockLanguageFileStorage()
    const initializer = new GameStateInitializer(
      gameStateMutator,
      settingsStorage,
      languageStorage,
      languageFileStorage
    )
    const gameData = createMinimalGameData()
    gameData.meta.initialState.map = 'start-map'

    // Act
    await initializer.initializeGameState(gameData)

    // Assert
    expect(gameStateMutator.state).toEqual({
      title: 'Test Game',
      activeSceneId: 'start-scene',
      activeMapId: 'start-map',
      flags: {},
      sceneStack: ['start-scene'],
      map: 'start-map',
    })
  })

  it('initializes empty flags object', async () => {
    // Arrange
    const gameStateMutator = createMockGameStateMutator()
    const settingsStorage = createMockSettingsStorage()
    const languageStorage = createMockLanguageStorage()
    const languageFileStorage = createMockLanguageFileStorage()
    const initializer = new GameStateInitializer(
      gameStateMutator,
      settingsStorage,
      languageStorage,
      languageFileStorage
    )
    const gameData = createMinimalGameData()

    // Act
    await initializer.initializeGameState(gameData)

    // Assert
    expect(gameStateMutator.state.flags).toEqual({})
  })

  it('sets sceneStack with initial scene', async () => {
    // Arrange
    const gameStateMutator = createMockGameStateMutator()
    const settingsStorage = createMockSettingsStorage()
    const languageStorage = createMockLanguageStorage()
    const languageFileStorage = createMockLanguageFileStorage()
    const initializer = new GameStateInitializer(
      gameStateMutator,
      settingsStorage,
      languageStorage,
      languageFileStorage
    )
    const gameData = createMinimalGameData()
    gameData.meta.initialState.scene = 'main-menu'

    // Act
    await initializer.initializeGameState(gameData)

    // Assert
    expect(gameStateMutator.state.sceneStack).toEqual(['main-menu'])
  })

  it('handles optional map when map is undefined', async () => {
    // Arrange
    const gameStateMutator = createMockGameStateMutator()
    const settingsStorage = createMockSettingsStorage()
    const languageStorage = createMockLanguageStorage()
    const languageFileStorage = createMockLanguageFileStorage()
    const initializer = new GameStateInitializer(
      gameStateMutator,
      settingsStorage,
      languageStorage,
      languageFileStorage
    )
    const gameData = createMinimalGameData()

    // Act
    await initializer.initializeGameState(gameData)

    // Assert
    expect(gameStateMutator.state.activeMapId).toBeNull()
  })

  it('registers language files for each language', async () => {
    // Arrange
    const gameStateMutator = createMockGameStateMutator()
    const settingsStorage = createMockSettingsStorage()
    const languageStorage = createMockLanguageStorage()
    const languageFileStorage = createMockLanguageFileStorage()
    const initializer = new GameStateInitializer(
      gameStateMutator,
      settingsStorage,
      languageStorage,
      languageFileStorage
    )
    const gameData = createMinimalGameData()
    gameData.meta.languages = {
      en: { name: 'English', files: ['system.json', 'game.json'] },
      es: { name: 'Spanish', files: ['system.json'] },
    }
    gameData.languages = createLanguageMap(gameData.meta.languages)

    // Act
    await initializer.initializeGameState(gameData)

    // Assert
    expect(languageFileStorage.setLanguageFileNames).toHaveBeenCalledTimes(2)
    expect(languageFileStorage.setLanguageFileNames).toHaveBeenCalledWith(
      'en',
      ['system.json', 'game.json']
    )
    expect(languageFileStorage.setLanguageFileNames).toHaveBeenCalledWith(
      'es',
      ['system.json']
    )
  })

  it('calls setLanguage with default language', async () => {
    // Arrange
    const gameStateMutator = createMockGameStateMutator()
    const settingsStorage = createMockSettingsStorage()
    const languageStorage = createMockLanguageStorage()
    const languageFileStorage = createMockLanguageFileStorage()
    const initializer = new GameStateInitializer(
      gameStateMutator,
      settingsStorage,
      languageStorage,
      languageFileStorage
    )
    const gameData = createMinimalGameData()
    gameData.meta.defaultSettings.language = 'fr'

    // Act
    await initializer.initializeGameState(gameData)

    // Assert
    expect(languageStorage.setLanguage).toHaveBeenCalledTimes(1)
    expect(languageStorage.setLanguage).toHaveBeenCalledWith('fr')
  })

  it('handles multiple languages', async () => {
    // Arrange
    const gameStateMutator = createMockGameStateMutator()
    const settingsStorage = createMockSettingsStorage()
    const languageStorage = createMockLanguageStorage()
    const languageFileStorage = createMockLanguageFileStorage()
    const initializer = new GameStateInitializer(
      gameStateMutator,
      settingsStorage,
      languageStorage,
      languageFileStorage
    )
    const gameData = createMinimalGameData()
    gameData.meta.languages = {
      en: { name: 'English', files: ['en-system.json'] },
      es: { name: 'Espanol', files: ['es-system.json'] },
      fr: { name: 'Francais', files: ['fr-system.json'] },
    }
    gameData.languages = createLanguageMap(gameData.meta.languages)

    // Act
    await initializer.initializeGameState(gameData)

    // Assert
    expect(languageFileStorage.setLanguageFileNames).toHaveBeenCalledTimes(3)
    expect(languageFileStorage.setLanguageFileNames).toHaveBeenCalledWith(
      'en',
      ['en-system.json']
    )
    expect(languageFileStorage.setLanguageFileNames).toHaveBeenCalledWith(
      'es',
      ['es-system.json']
    )
    expect(languageFileStorage.setLanguageFileNames).toHaveBeenCalledWith(
      'fr',
      ['fr-system.json']
    )
  })

  it('completes full initialization integration', async () => {
    // Arrange
    const gameStateMutator = createMockGameStateMutator()
    const settingsStorage = createMockSettingsStorage()
    const languageStorage = createMockLanguageStorage()
    const languageFileStorage = createMockLanguageFileStorage()
    const initializer = new GameStateInitializer(
      gameStateMutator,
      settingsStorage,
      languageStorage,
      languageFileStorage
    )
    const gameData: GameData = {
      meta: {
        id: 'integration-test-game',
        createdAt: baseTimestamp,
        updatedAt: baseTimestamp,
        title: 'Integration Test Game',
        description: 'Integration test data',
        version: '1.0.0',
        defaultSettings: {
          language: 'en',
          volume: 0.7,
        },
        languages: {
          en: { name: 'English', files: ['system.json', 'ui.json'] },
          de: { name: 'Deutsch', files: ['system.json'] },
        },
        initialState: {
          scene: 'start-menu',
          map: 'world-map',
        },
        scenes: ['start-menu'],
        styling: [],
        tileSets: [],
        maps: ['world-map'],
        items: [],
        componentDefinitions: [],
        appearanceCategories: [],
        appearances: [],
        virtualKeys: 'virtual-keys',
        virtualInputs: 'virtual-inputs',
      },
      languages: createLanguageMap({
        en: { name: 'English', files: ['system.json', 'ui.json'] },
        de: { name: 'Deutsch', files: ['system.json'] },
      }),
      scenes: [],
      maps: [],
      tileSets: [],
      items: [],
      componentDefinitions: [],
      appearanceCategories: [],
      appearances: [],
      virtualKeys: {
        id: 'virtual-keys',
        createdAt: baseTimestamp,
        updatedAt: baseTimestamp,
        mappings: [],
      },
      virtualInputs: {
        id: 'virtual-inputs',
        createdAt: baseTimestamp,
        updatedAt: baseTimestamp,
        mappings: [],
      },
    }

    // Act
    await initializer.initializeGameState(gameData)

    // Assert
    expect(settingsStorage.setDefaultSettings).toHaveBeenCalledWith({
      language: 'en',
      volume: 0.7,
    })
    expect(gameStateMutator.state).toEqual({
      title: 'Integration Test Game',
      activeSceneId: 'start-menu',
      activeMapId: 'world-map',
      flags: {},
      sceneStack: ['start-menu'],
      map: 'world-map',
    })
    expect(languageFileStorage.setLanguageFileNames).toHaveBeenCalledWith(
      'en',
      ['system.json', 'ui.json']
    )
    expect(languageFileStorage.setLanguageFileNames).toHaveBeenCalledWith(
      'de',
      ['system.json']
    )
    expect(languageStorage.setLanguage).toHaveBeenCalledWith('en')
  })

  it('preserves additional initialState properties', async () => {
    // Arrange
    const gameStateMutator = createMockGameStateMutator()
    const settingsStorage = createMockSettingsStorage()
    const languageStorage = createMockLanguageStorage()
    const languageFileStorage = createMockLanguageFileStorage()
    const initializer = new GameStateInitializer(
      gameStateMutator,
      settingsStorage,
      languageStorage,
      languageFileStorage
    )
    const gameData = createMinimalGameData()
    // Add extra properties to initialState that should be spread
    Object.assign(gameData.meta.initialState, {
      customProperty: 'test-value',
      anotherProperty: 42,
    })

    // Act
    await initializer.initializeGameState(gameData)

    // Assert
    expect(gameStateMutator.state).toMatchObject({
      title: 'Test Game',
      activeSceneId: 'start-scene',
      customProperty: 'test-value',
      anotherProperty: 42,
    })
  })
})
