import { describe, expect, it, vi } from 'vitest'
import type { GameData } from '@ancadeba/schemas'
import type { IGameStateMutator } from '../../../gameState.ts/storage'
import type { ISettingsStorage } from '../../../settings/storage'
import type { ILanguageStorage } from '../../../language/storage'
import type { IResourceDataStorage } from '../../../resourceData/storage'
import { GameStateInitializer } from '../../../core/initializers/gameStateInitializer'

describe('core/initializers/gameStateInitializer', () => {
  const createMockGameStateMutator = (): IGameStateMutator => ({
    state: null!,
    updateSceneId: vi.fn(),
    updateMapId: vi.fn(),
    setFlag: vi.fn(),
    pushScene: vi.fn(),
    popScene: vi.fn(),
  })

  const createMockSettingsStorage = (): ISettingsStorage => ({
    get language() {
      return 'en'
    },
    get volume() {
      return 5
    },
    setDefaultSettings: vi.fn(),
    updateLanguage: vi.fn(),
    updateVolume: vi.fn(),
  })

  const createMockLanguageStorage = (): ILanguageStorage => ({
    setLanguage: vi.fn().mockResolvedValue(undefined),
    getTranslation: vi.fn(),
  })

  const createMockResourceDataStorage = (): IResourceDataStorage => ({
    get rootPath() {
      return '/resources'
    },
    logResourceData: vi.fn(),
    addSceneData: vi.fn(),
    getSceneData: vi.fn(),
    addTileData: vi.fn(),
    getTileData: vi.fn(),
    addCssFileName: vi.fn(),
    getCssFileNames: vi.fn(() => []),
    addMapData: vi.fn(),
    getMapData: vi.fn(),
    getLanguageFileNames: vi.fn(() => []),
    setLanguageFileNames: vi.fn(),
  })

  const createMinimalGameData = (): GameData => ({
    meta: {
      title: 'Test Game',
      defaultSettings: {
        language: 'en',
        volume: 5,
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
    },
    scenes: [],
    maps: [],
    tileSets: [],
  })

  it('sets default settings correctly', async () => {
    // Arrange
    const gameStateMutator = createMockGameStateMutator()
    const settingsStorage = createMockSettingsStorage()
    const languageStorage = createMockLanguageStorage()
    const resourceDataStorage = createMockResourceDataStorage()
    const initializer = new GameStateInitializer(
      gameStateMutator,
      settingsStorage,
      languageStorage,
      resourceDataStorage
    )
    const gameData = createMinimalGameData()

    // Act
    await initializer.initializeGameState(gameData)

    // Assert
    expect(settingsStorage.setDefaultSettings).toHaveBeenCalledTimes(1)
    expect(settingsStorage.setDefaultSettings).toHaveBeenCalledWith({
      language: 'en',
      volume: 5,
    })
  })

  it('initializes game state with title, activeSceneId, activeMapId', async () => {
    // Arrange
    const gameStateMutator = createMockGameStateMutator()
    const settingsStorage = createMockSettingsStorage()
    const languageStorage = createMockLanguageStorage()
    const resourceDataStorage = createMockResourceDataStorage()
    const initializer = new GameStateInitializer(
      gameStateMutator,
      settingsStorage,
      languageStorage,
      resourceDataStorage
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
    const resourceDataStorage = createMockResourceDataStorage()
    const initializer = new GameStateInitializer(
      gameStateMutator,
      settingsStorage,
      languageStorage,
      resourceDataStorage
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
    const resourceDataStorage = createMockResourceDataStorage()
    const initializer = new GameStateInitializer(
      gameStateMutator,
      settingsStorage,
      languageStorage,
      resourceDataStorage
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
    const resourceDataStorage = createMockResourceDataStorage()
    const initializer = new GameStateInitializer(
      gameStateMutator,
      settingsStorage,
      languageStorage,
      resourceDataStorage
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
    const resourceDataStorage = createMockResourceDataStorage()
    const initializer = new GameStateInitializer(
      gameStateMutator,
      settingsStorage,
      languageStorage,
      resourceDataStorage
    )
    const gameData = createMinimalGameData()
    gameData.meta.languages = {
      en: { name: 'English', files: ['system.json', 'game.json'] },
      es: { name: 'Spanish', files: ['system.json'] },
    }

    // Act
    await initializer.initializeGameState(gameData)

    // Assert
    expect(resourceDataStorage.setLanguageFileNames).toHaveBeenCalledTimes(2)
    expect(resourceDataStorage.setLanguageFileNames).toHaveBeenCalledWith(
      'en',
      ['system.json', 'game.json']
    )
    expect(resourceDataStorage.setLanguageFileNames).toHaveBeenCalledWith(
      'es',
      ['system.json']
    )
  })

  it('calls setLanguage with default language', async () => {
    // Arrange
    const gameStateMutator = createMockGameStateMutator()
    const settingsStorage = createMockSettingsStorage()
    const languageStorage = createMockLanguageStorage()
    const resourceDataStorage = createMockResourceDataStorage()
    const initializer = new GameStateInitializer(
      gameStateMutator,
      settingsStorage,
      languageStorage,
      resourceDataStorage
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
    const resourceDataStorage = createMockResourceDataStorage()
    const initializer = new GameStateInitializer(
      gameStateMutator,
      settingsStorage,
      languageStorage,
      resourceDataStorage
    )
    const gameData = createMinimalGameData()
    gameData.meta.languages = {
      en: { name: 'English', files: ['en-system.json'] },
      es: { name: 'Español', files: ['es-system.json'] },
      fr: { name: 'Français', files: ['fr-system.json'] },
    }

    // Act
    await initializer.initializeGameState(gameData)

    // Assert
    expect(resourceDataStorage.setLanguageFileNames).toHaveBeenCalledTimes(3)
    expect(resourceDataStorage.setLanguageFileNames).toHaveBeenCalledWith(
      'en',
      ['en-system.json']
    )
    expect(resourceDataStorage.setLanguageFileNames).toHaveBeenCalledWith(
      'es',
      ['es-system.json']
    )
    expect(resourceDataStorage.setLanguageFileNames).toHaveBeenCalledWith(
      'fr',
      ['fr-system.json']
    )
  })

  it('completes full initialization integration', async () => {
    // Arrange
    const gameStateMutator = createMockGameStateMutator()
    const settingsStorage = createMockSettingsStorage()
    const languageStorage = createMockLanguageStorage()
    const resourceDataStorage = createMockResourceDataStorage()
    const initializer = new GameStateInitializer(
      gameStateMutator,
      settingsStorage,
      languageStorage,
      resourceDataStorage
    )
    const gameData: GameData = {
      meta: {
        title: 'Integration Test Game',
        defaultSettings: {
          language: 'en',
          volume: 7,
        },
        languages: {
          en: { name: 'English', files: ['system.json', 'ui.json'] },
          de: { name: 'Deutsch', files: ['system.json'] },
        },
        initialState: {
          scene: 'start-menu',
          map: 'world-map',
        },
      },
      scenes: [],
      maps: [],
      tileSets: [],
    }

    // Act
    await initializer.initializeGameState(gameData)

    // Assert
    expect(settingsStorage.setDefaultSettings).toHaveBeenCalledWith({
      language: 'en',
      volume: 7,
    })
    expect(gameStateMutator.state).toEqual({
      title: 'Integration Test Game',
      activeSceneId: 'start-menu',
      activeMapId: 'world-map',
      flags: {},
      sceneStack: ['start-menu'],
      map: 'world-map',
    })
    expect(resourceDataStorage.setLanguageFileNames).toHaveBeenCalledWith(
      'en',
      ['system.json', 'ui.json']
    )
    expect(resourceDataStorage.setLanguageFileNames).toHaveBeenCalledWith(
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
    const resourceDataStorage = createMockResourceDataStorage()
    const initializer = new GameStateInitializer(
      gameStateMutator,
      settingsStorage,
      languageStorage,
      resourceDataStorage
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
