import { describe, expect, it, vi } from 'vitest'
import type { GameData } from '@ancadeba/schemas'
import type { IGameStateInitializer } from '../../core/initializers/gameStateInitializer'
import type { ISceneDataInitializer } from '../../core/initializers/sceneDataInitializer'
import type { ITileDataInitializer } from '../../core/initializers/tileDataInitializer'
import type { IMapDataInitializer } from '../../core/initializers/mapDataInitializer'
import type { IResourceDataStorage } from '../../resourceData/storage'
import { GameDataInitializer } from '../../core/gameDataInitializer'

describe('core/gameDataInitializer', () => {
  const createMockGameStateInitializer = (): IGameStateInitializer => ({
    initializeGameState: vi.fn().mockResolvedValue(undefined),
  })

  const createMockSceneDataInitializer = (): ISceneDataInitializer => ({
    initializeScenes: vi.fn(),
    initializeStyling: vi.fn(),
  })

  const createMockTileDataInitializer = (): ITileDataInitializer => ({
    initializeTiles: vi.fn(),
  })

  const createMockMapDataInitializer = (): IMapDataInitializer => ({
    initializeMaps: vi.fn(),
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
    setVirtualKeys: vi.fn(),
    getVirtualKeys: vi.fn(() => []),
    setVirtualInputs: vi.fn(),
    getVirtualInputs: vi.fn(() => []),
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
    virtualKeys: {
      id: 'virtual-keys',
      createdAt: '2026-01-10T00:00:00Z',
      updatedAt: '2026-01-10T00:00:00Z',
      mappings: [],
    },
    virtualInputs: {
      id: 'virtual-inputs',
      createdAt: '2026-01-10T00:00:00Z',
      updatedAt: '2026-01-10T00:00:00Z',
      mappings: [],
    },
  })

  it('calls gameStateInitializer.initializeGameState with gameData', async () => {
    // Arrange
    const gameStateInitializer = createMockGameStateInitializer()
    const sceneDataInitializer = createMockSceneDataInitializer()
    const tileDataInitializer = createMockTileDataInitializer()
    const mapDataInitializer = createMockMapDataInitializer()
    const resourceDataStorage = createMockResourceDataStorage()
    const initializer = new GameDataInitializer(
      gameStateInitializer,
      sceneDataInitializer,
      tileDataInitializer,
      mapDataInitializer,
      resourceDataStorage
    )
    const gameData = createMinimalGameData()

    // Act
    await initializer.initialize(gameData)

    // Assert
    expect(gameStateInitializer.initializeGameState).toHaveBeenCalledTimes(1)
    expect(gameStateInitializer.initializeGameState).toHaveBeenCalledWith(
      gameData
    )
  })

  it('calls sceneDataInitializer.initializeScenes with scenes array', async () => {
    // Arrange
    const gameStateInitializer = createMockGameStateInitializer()
    const sceneDataInitializer = createMockSceneDataInitializer()
    const tileDataInitializer = createMockTileDataInitializer()
    const mapDataInitializer = createMockMapDataInitializer()
    const resourceDataStorage = createMockResourceDataStorage()
    const initializer = new GameDataInitializer(
      gameStateInitializer,
      sceneDataInitializer,
      tileDataInitializer,
      mapDataInitializer,
      resourceDataStorage
    )
    const gameData = createMinimalGameData()
    gameData.scenes = [
      { id: 'scene1', sceneType: 'menu', components: [] },
      { id: 'scene2', sceneType: 'game', components: [] },
    ]

    // Act
    await initializer.initialize(gameData)

    // Assert
    expect(sceneDataInitializer.initializeScenes).toHaveBeenCalledTimes(1)
    expect(sceneDataInitializer.initializeScenes).toHaveBeenCalledWith(
      gameData.scenes
    )
  })

  it('calls sceneDataInitializer.initializeStyling with styling array from meta', async () => {
    // Arrange
    const gameStateInitializer = createMockGameStateInitializer()
    const sceneDataInitializer = createMockSceneDataInitializer()
    const tileDataInitializer = createMockTileDataInitializer()
    const mapDataInitializer = createMockMapDataInitializer()
    const resourceDataStorage = createMockResourceDataStorage()
    const initializer = new GameDataInitializer(
      gameStateInitializer,
      sceneDataInitializer,
      tileDataInitializer,
      mapDataInitializer,
      resourceDataStorage
    )
    const gameData = createMinimalGameData()
    gameData.meta.styling = ['theme.css', 'layout.css']

    // Act
    await initializer.initialize(gameData)

    // Assert
    expect(sceneDataInitializer.initializeStyling).toHaveBeenCalledTimes(1)
    expect(sceneDataInitializer.initializeStyling).toHaveBeenCalledWith([
      'theme.css',
      'layout.css',
    ])
  })

  it('calls tileDataInitializer.initializeTiles with tileSets array', async () => {
    // Arrange
    const gameStateInitializer = createMockGameStateInitializer()
    const sceneDataInitializer = createMockSceneDataInitializer()
    const tileDataInitializer = createMockTileDataInitializer()
    const mapDataInitializer = createMockMapDataInitializer()
    const resourceDataStorage = createMockResourceDataStorage()
    const initializer = new GameDataInitializer(
      gameStateInitializer,
      sceneDataInitializer,
      tileDataInitializer,
      mapDataInitializer,
      resourceDataStorage
    )
    const gameData = createMinimalGameData()
    gameData.tileSets = [
      { id: 'outdoor', tiles: [] },
      { id: 'indoor', tiles: [] },
    ]

    // Act
    await initializer.initialize(gameData)

    // Assert
    expect(tileDataInitializer.initializeTiles).toHaveBeenCalledTimes(1)
    expect(tileDataInitializer.initializeTiles).toHaveBeenCalledWith(
      gameData.tileSets
    )
  })

  it('calls mapDataInitializer.initializeMaps with maps array', async () => {
    // Arrange
    const gameStateInitializer = createMockGameStateInitializer()
    const sceneDataInitializer = createMockSceneDataInitializer()
    const tileDataInitializer = createMockTileDataInitializer()
    const mapDataInitializer = createMockMapDataInitializer()
    const resourceDataStorage = createMockResourceDataStorage()
    const initializer = new GameDataInitializer(
      gameStateInitializer,
      sceneDataInitializer,
      tileDataInitializer,
      mapDataInitializer,
      resourceDataStorage
    )
    const gameData = createMinimalGameData()
    gameData.maps = [
      { id: 'map1', width: 10, height: 10, tiles: [], map: [] },
      { id: 'map2', width: 5, height: 5, tiles: [], map: [] },
    ]

    // Act
    await initializer.initialize(gameData)

    // Assert
    expect(mapDataInitializer.initializeMaps).toHaveBeenCalledTimes(1)
    expect(mapDataInitializer.initializeMaps).toHaveBeenCalledWith(
      gameData.maps
    )
  })

  it('calls resourceDataStorage.logResourceData after all initialization', async () => {
    // Arrange
    const gameStateInitializer = createMockGameStateInitializer()
    const sceneDataInitializer = createMockSceneDataInitializer()
    const tileDataInitializer = createMockTileDataInitializer()
    const mapDataInitializer = createMockMapDataInitializer()
    const resourceDataStorage = createMockResourceDataStorage()
    const initializer = new GameDataInitializer(
      gameStateInitializer,
      sceneDataInitializer,
      tileDataInitializer,
      mapDataInitializer,
      resourceDataStorage
    )
    const gameData = createMinimalGameData()

    // Act
    await initializer.initialize(gameData)

    // Assert
    expect(resourceDataStorage.logResourceData).toHaveBeenCalledTimes(1)
  })

  it('initializes in correct order with gameState before others', async () => {
    // Arrange
    const callOrder: string[] = []
    const gameStateInitializer = createMockGameStateInitializer()
    vi.mocked(gameStateInitializer.initializeGameState).mockImplementation(
      async () => {
        callOrder.push('gameState')
      }
    )
    const sceneDataInitializer = createMockSceneDataInitializer()
    vi.mocked(sceneDataInitializer.initializeScenes).mockImplementation(() => {
      callOrder.push('scenes')
    })
    vi.mocked(sceneDataInitializer.initializeStyling).mockImplementation(() => {
      callOrder.push('styling')
    })
    const tileDataInitializer = createMockTileDataInitializer()
    vi.mocked(tileDataInitializer.initializeTiles).mockImplementation(() => {
      callOrder.push('tiles')
    })
    const mapDataInitializer = createMockMapDataInitializer()
    vi.mocked(mapDataInitializer.initializeMaps).mockImplementation(() => {
      callOrder.push('maps')
    })
    const resourceDataStorage = createMockResourceDataStorage()
    vi.mocked(resourceDataStorage.logResourceData).mockImplementation(() => {
      callOrder.push('logResourceData')
    })
    const initializer = new GameDataInitializer(
      gameStateInitializer,
      sceneDataInitializer,
      tileDataInitializer,
      mapDataInitializer,
      resourceDataStorage
    )
    const gameData = createMinimalGameData()

    // Act
    await initializer.initialize(gameData)

    // Assert
    expect(callOrder).toEqual([
      'gameState',
      'scenes',
      'styling',
      'tiles',
      'maps',
      'logResourceData',
    ])
  })

  it('completes async initialization properly', async () => {
    // Arrange
    const gameStateInitializer = createMockGameStateInitializer()
    let gameStateResolved = false
    vi.mocked(gameStateInitializer.initializeGameState).mockImplementation(
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        gameStateResolved = true
      }
    )
    const sceneDataInitializer = createMockSceneDataInitializer()
    const tileDataInitializer = createMockTileDataInitializer()
    const mapDataInitializer = createMockMapDataInitializer()
    const resourceDataStorage = createMockResourceDataStorage()
    const initializer = new GameDataInitializer(
      gameStateInitializer,
      sceneDataInitializer,
      tileDataInitializer,
      mapDataInitializer,
      resourceDataStorage
    )
    const gameData = createMinimalGameData()

    // Act
    await initializer.initialize(gameData)

    // Assert
    expect(gameStateResolved).toBe(true)
    expect(sceneDataInitializer.initializeScenes).toHaveBeenCalled()
  })

  it('completes full integration with all dependencies', async () => {
    // Arrange
    const gameStateInitializer = createMockGameStateInitializer()
    const sceneDataInitializer = createMockSceneDataInitializer()
    const tileDataInitializer = createMockTileDataInitializer()
    const mapDataInitializer = createMockMapDataInitializer()
    const resourceDataStorage = createMockResourceDataStorage()
    const initializer = new GameDataInitializer(
      gameStateInitializer,
      sceneDataInitializer,
      tileDataInitializer,
      mapDataInitializer,
      resourceDataStorage
    )
    const gameData: GameData = {
      meta: {
        title: 'Full Integration Test',
        defaultSettings: {
          language: 'en',
          volume: 8,
        },
        languages: {
          en: { name: 'English', files: ['system.json'] },
        },
        initialState: {
          scene: 'start',
          map: 'world',
        },
        styling: ['game.css', 'theme.css'],
      },
      scenes: [
        { id: 'start', sceneType: 'menu', components: [] },
        { id: 'game', sceneType: 'game', components: [] },
      ],
      tileSets: [{ id: 'outdoor', tiles: [] }],
      maps: [{ id: 'world', width: 10, height: 10, tiles: [], map: [] }],
      virtualKeys: {
        id: 'virtual-keys',
        createdAt: '2026-01-10T00:00:00Z',
        updatedAt: '2026-01-10T00:00:00Z',
        mappings: [],
      },
      virtualInputs: {
        id: 'virtual-inputs',
        createdAt: '2026-01-10T00:00:00Z',
        updatedAt: '2026-01-10T00:00:00Z',
        mappings: [],
      },
    }

    // Act
    await initializer.initialize(gameData)

    // Assert
    expect(gameStateInitializer.initializeGameState).toHaveBeenCalledWith(
      gameData
    )
    expect(sceneDataInitializer.initializeScenes).toHaveBeenCalledWith(
      gameData.scenes
    )
    expect(sceneDataInitializer.initializeStyling).toHaveBeenCalledWith([
      'game.css',
      'theme.css',
    ])
    expect(tileDataInitializer.initializeTiles).toHaveBeenCalledWith(
      gameData.tileSets
    )
    expect(mapDataInitializer.initializeMaps).toHaveBeenCalledWith(
      gameData.maps
    )
    expect(resourceDataStorage.logResourceData).toHaveBeenCalled()
  })
})
