import { describe, expect, it, vi } from 'vitest'
import type { GameData, Map as MapData, Scene, TileSet } from '@ancadeba/schemas'
import type { IGameStateInitializer } from '../../core/initializers/gameStateInitializer'
import type { IEntityInitializer } from '../../core/initializers/entityInitializer'
import type { ISceneDataInitializer } from '../../core/initializers/sceneDataInitializer'
import type { ITileDataInitializer } from '../../core/initializers/tileDataInitializer'
import type { IMapDataInitializer } from '../../core/initializers/mapDataInitializer'
import type { IItemDataInitializer } from '../../core/initializers/itemDataInitializer'
import type { IAppearanceCategoryInitializer } from '../../core/initializers/appearanceCategoryInitializer'
import type { IAppearanceDataInitializer } from '../../core/initializers/appearanceDataInitializer'
import type {
  IVirtualKeyStorage,
  IVirtualInputStorage,
  IResourceDataLogger,
} from '../../resourceData/storage'
import { GameDataInitializer } from '../../core/gameDataInitializer'

describe('core/gameDataInitializer', () => {
  const createMockGameStateInitializer = (): IGameStateInitializer => ({
    initializeGameState: vi.fn().mockResolvedValue(undefined),
  })

  const createMockEntityInitializer = (): IEntityInitializer => ({
    initializeEntities: vi.fn(),
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

  const createMockItemDataInitializer = (): IItemDataInitializer => ({
    initializeItems: vi.fn(),
  })

  const createMockAppearanceCategoryInitializer =
    (): IAppearanceCategoryInitializer => ({
      initializeAppearanceCategories: vi.fn(),
    })

  const createMockAppearanceDataInitializer =
    (): IAppearanceDataInitializer => ({
      initializeAppearances: vi.fn(),
    })

  const createMockVirtualKeyStorage = (): IVirtualKeyStorage => ({
    setVirtualKeys: vi.fn(),
    getVirtualKeys: vi.fn(() => []),
  })

  const createMockVirtualInputStorage = (): IVirtualInputStorage => ({
    setVirtualInputs: vi.fn(),
    getVirtualInputs: vi.fn(() => []),
  })

  const createMockResourceDataLogger = (): IResourceDataLogger => ({
    logResourceData: vi.fn(),
  })

  const baseTimestamp = '2026-01-10T00:00:00Z'

  const createLanguageMap = (
    languages: GameData['meta']['languages']
  ): GameData['languages'] =>
    new Map(
      Object.entries(languages).map(([key, value]) => [key, value])
    )

  const createScene = (id: string): Scene => ({
    id,
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
    screen: { type: 'grid', grid: { rows: 1, columns: 1 } },
    components: [],
  })

  const createTileSet = (id: string): TileSet => ({
    id,
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
    tiles: [],
  })

  const createMapData = (id: string): MapData => ({
    id,
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
    width: 1,
    height: 1,
    tiles: [],
    map: [],
  })

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

  it('calls gameStateInitializer.initializeGameState with gameData', async () => {
    // Arrange
    const gameStateInitializer = createMockGameStateInitializer()
    const entityInitializer = createMockEntityInitializer()
    const sceneDataInitializer = createMockSceneDataInitializer()
    const tileDataInitializer = createMockTileDataInitializer()
    const mapDataInitializer = createMockMapDataInitializer()
    const itemDataInitializer = createMockItemDataInitializer()
    const appearanceCategoryInitializer =
      createMockAppearanceCategoryInitializer()
    const appearanceDataInitializer = createMockAppearanceDataInitializer()
    const virtualKeyStorage = createMockVirtualKeyStorage()
    const virtualInputStorage = createMockVirtualInputStorage()
    const resourceDataLogger = createMockResourceDataLogger()
    const initializer = new GameDataInitializer(
      gameStateInitializer,
      entityInitializer,
      sceneDataInitializer,
      tileDataInitializer,
      mapDataInitializer,
      itemDataInitializer,
      appearanceCategoryInitializer,
      appearanceDataInitializer,
      virtualKeyStorage,
      virtualInputStorage,
      resourceDataLogger
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

  it('calls entityInitializer.initializeEntities with gameData', async () => {
    // Arrange
    const gameStateInitializer = createMockGameStateInitializer()
    const entityInitializer = createMockEntityInitializer()
    const sceneDataInitializer = createMockSceneDataInitializer()
    const tileDataInitializer = createMockTileDataInitializer()
    const mapDataInitializer = createMockMapDataInitializer()
    const itemDataInitializer = createMockItemDataInitializer()
    const appearanceCategoryInitializer =
      createMockAppearanceCategoryInitializer()
    const appearanceDataInitializer = createMockAppearanceDataInitializer()
    const virtualKeyStorage = createMockVirtualKeyStorage()
    const virtualInputStorage = createMockVirtualInputStorage()
    const resourceDataLogger = createMockResourceDataLogger()
    const initializer = new GameDataInitializer(
      gameStateInitializer,
      entityInitializer,
      sceneDataInitializer,
      tileDataInitializer,
      mapDataInitializer,
      itemDataInitializer,
      appearanceCategoryInitializer,
      appearanceDataInitializer,
      virtualKeyStorage,
      virtualInputStorage,
      resourceDataLogger
    )
    const gameData = createMinimalGameData()

    // Act
    await initializer.initialize(gameData)

    // Assert
    expect(entityInitializer.initializeEntities).toHaveBeenCalledTimes(1)
    expect(entityInitializer.initializeEntities).toHaveBeenCalledWith(gameData)
  })

  it('calls sceneDataInitializer.initializeScenes with scenes array', async () => {
    // Arrange
    const gameStateInitializer = createMockGameStateInitializer()
    const entityInitializer = createMockEntityInitializer()
    const sceneDataInitializer = createMockSceneDataInitializer()
    const tileDataInitializer = createMockTileDataInitializer()
    const mapDataInitializer = createMockMapDataInitializer()
    const itemDataInitializer = createMockItemDataInitializer()
    const appearanceCategoryInitializer =
      createMockAppearanceCategoryInitializer()
    const appearanceDataInitializer = createMockAppearanceDataInitializer()
    const virtualKeyStorage = createMockVirtualKeyStorage()
    const virtualInputStorage = createMockVirtualInputStorage()
    const resourceDataLogger = createMockResourceDataLogger()
    const initializer = new GameDataInitializer(
      gameStateInitializer,
      entityInitializer,
      sceneDataInitializer,
      tileDataInitializer,
      mapDataInitializer,
      itemDataInitializer,
      appearanceCategoryInitializer,
      appearanceDataInitializer,
      virtualKeyStorage,
      virtualInputStorage,
      resourceDataLogger
    )
    const gameData = createMinimalGameData()
    gameData.scenes = [createScene('scene1'), createScene('scene2')]
    gameData.meta.scenes = gameData.scenes.map((scene) => scene.id)

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
    const entityInitializer = createMockEntityInitializer()
    const sceneDataInitializer = createMockSceneDataInitializer()
    const tileDataInitializer = createMockTileDataInitializer()
    const mapDataInitializer = createMockMapDataInitializer()
    const itemDataInitializer = createMockItemDataInitializer()
    const appearanceCategoryInitializer =
      createMockAppearanceCategoryInitializer()
    const appearanceDataInitializer = createMockAppearanceDataInitializer()
    const virtualKeyStorage = createMockVirtualKeyStorage()
    const virtualInputStorage = createMockVirtualInputStorage()
    const resourceDataLogger = createMockResourceDataLogger()
    const initializer = new GameDataInitializer(
      gameStateInitializer,
      entityInitializer,
      sceneDataInitializer,
      tileDataInitializer,
      mapDataInitializer,
      itemDataInitializer,
      appearanceCategoryInitializer,
      appearanceDataInitializer,
      virtualKeyStorage,
      virtualInputStorage,
      resourceDataLogger
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
    const entityInitializer = createMockEntityInitializer()
    const sceneDataInitializer = createMockSceneDataInitializer()
    const tileDataInitializer = createMockTileDataInitializer()
    const mapDataInitializer = createMockMapDataInitializer()
    const itemDataInitializer = createMockItemDataInitializer()
    const appearanceCategoryInitializer =
      createMockAppearanceCategoryInitializer()
    const appearanceDataInitializer = createMockAppearanceDataInitializer()
    const virtualKeyStorage = createMockVirtualKeyStorage()
    const virtualInputStorage = createMockVirtualInputStorage()
    const resourceDataLogger = createMockResourceDataLogger()
    const initializer = new GameDataInitializer(
      gameStateInitializer,
      entityInitializer,
      sceneDataInitializer,
      tileDataInitializer,
      mapDataInitializer,
      itemDataInitializer,
      appearanceCategoryInitializer,
      appearanceDataInitializer,
      virtualKeyStorage,
      virtualInputStorage,
      resourceDataLogger
    )
    const gameData = createMinimalGameData()
    gameData.tileSets = [createTileSet('outdoor'), createTileSet('indoor')]
    gameData.meta.tileSets = gameData.tileSets.map((tileSet) => tileSet.id)

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
    const entityInitializer = createMockEntityInitializer()
    const sceneDataInitializer = createMockSceneDataInitializer()
    const tileDataInitializer = createMockTileDataInitializer()
    const mapDataInitializer = createMockMapDataInitializer()
    const itemDataInitializer = createMockItemDataInitializer()
    const appearanceCategoryInitializer =
      createMockAppearanceCategoryInitializer()
    const appearanceDataInitializer = createMockAppearanceDataInitializer()
    const virtualKeyStorage = createMockVirtualKeyStorage()
    const virtualInputStorage = createMockVirtualInputStorage()
    const resourceDataLogger = createMockResourceDataLogger()
    const initializer = new GameDataInitializer(
      gameStateInitializer,
      entityInitializer,
      sceneDataInitializer,
      tileDataInitializer,
      mapDataInitializer,
      itemDataInitializer,
      appearanceCategoryInitializer,
      appearanceDataInitializer,
      virtualKeyStorage,
      virtualInputStorage,
      resourceDataLogger
    )
    const gameData = createMinimalGameData()
    gameData.maps = [createMapData('map1'), createMapData('map2')]
    gameData.meta.maps = gameData.maps.map((map) => map.id)

    // Act
    await initializer.initialize(gameData)

    // Assert
    expect(mapDataInitializer.initializeMaps).toHaveBeenCalledTimes(1)
    expect(mapDataInitializer.initializeMaps).toHaveBeenCalledWith(
      gameData.maps
    )
  })

  it('calls resourceDataLogger.logResourceData after all initialization', async () => {
    // Arrange
    const gameStateInitializer = createMockGameStateInitializer()
    const entityInitializer = createMockEntityInitializer()
    const sceneDataInitializer = createMockSceneDataInitializer()
    const tileDataInitializer = createMockTileDataInitializer()
    const mapDataInitializer = createMockMapDataInitializer()
    const itemDataInitializer = createMockItemDataInitializer()
    const appearanceCategoryInitializer =
      createMockAppearanceCategoryInitializer()
    const appearanceDataInitializer = createMockAppearanceDataInitializer()
    const virtualKeyStorage = createMockVirtualKeyStorage()
    const virtualInputStorage = createMockVirtualInputStorage()
    const resourceDataLogger = createMockResourceDataLogger()
    const initializer = new GameDataInitializer(
      gameStateInitializer,
      entityInitializer,
      sceneDataInitializer,
      tileDataInitializer,
      mapDataInitializer,
      itemDataInitializer,
      appearanceCategoryInitializer,
      appearanceDataInitializer,
      virtualKeyStorage,
      virtualInputStorage,
      resourceDataLogger
    )
    const gameData = createMinimalGameData()

    // Act
    await initializer.initialize(gameData)

    // Assert
    expect(resourceDataLogger.logResourceData).toHaveBeenCalledTimes(1)
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
    const entityInitializer = createMockEntityInitializer()
    vi.mocked(entityInitializer.initializeEntities).mockImplementation(() => {
      callOrder.push('entities')
    })
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
    const itemDataInitializer = createMockItemDataInitializer()
    const appearanceCategoryInitializer =
      createMockAppearanceCategoryInitializer()
    const appearanceDataInitializer = createMockAppearanceDataInitializer()
    const virtualKeyStorage = createMockVirtualKeyStorage()
    const virtualInputStorage = createMockVirtualInputStorage()
    const resourceDataLogger = createMockResourceDataLogger()
    vi.mocked(resourceDataLogger.logResourceData).mockImplementation(() => {
      callOrder.push('logResourceData')
    })
    const initializer = new GameDataInitializer(
      gameStateInitializer,
      entityInitializer,
      sceneDataInitializer,
      tileDataInitializer,
      mapDataInitializer,
      itemDataInitializer,
      appearanceCategoryInitializer,
      appearanceDataInitializer,
      virtualKeyStorage,
      virtualInputStorage,
      resourceDataLogger
    )
    const gameData = createMinimalGameData()

    // Act
    await initializer.initialize(gameData)

    // Assert
    expect(callOrder).toEqual([
      'gameState',
      'entities',
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
    const entityInitializer = createMockEntityInitializer()
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
    const itemDataInitializer = createMockItemDataInitializer()
    const appearanceCategoryInitializer =
      createMockAppearanceCategoryInitializer()
    const appearanceDataInitializer = createMockAppearanceDataInitializer()
    const virtualKeyStorage = createMockVirtualKeyStorage()
    const virtualInputStorage = createMockVirtualInputStorage()
    const resourceDataLogger = createMockResourceDataLogger()
    const initializer = new GameDataInitializer(
      gameStateInitializer,
      entityInitializer,
      sceneDataInitializer,
      tileDataInitializer,
      mapDataInitializer,
      itemDataInitializer,
      appearanceCategoryInitializer,
      appearanceDataInitializer,
      virtualKeyStorage,
      virtualInputStorage,
      resourceDataLogger
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
    const entityInitializer = createMockEntityInitializer()
    const sceneDataInitializer = createMockSceneDataInitializer()
    const tileDataInitializer = createMockTileDataInitializer()
    const mapDataInitializer = createMockMapDataInitializer()
    const itemDataInitializer = createMockItemDataInitializer()
    const appearanceCategoryInitializer =
      createMockAppearanceCategoryInitializer()
    const appearanceDataInitializer = createMockAppearanceDataInitializer()
    const virtualKeyStorage = createMockVirtualKeyStorage()
    const virtualInputStorage = createMockVirtualInputStorage()
    const resourceDataLogger = createMockResourceDataLogger()
    const initializer = new GameDataInitializer(
      gameStateInitializer,
      entityInitializer,
      sceneDataInitializer,
      tileDataInitializer,
      mapDataInitializer,
      itemDataInitializer,
      appearanceCategoryInitializer,
      appearanceDataInitializer,
      virtualKeyStorage,
      virtualInputStorage,
      resourceDataLogger
    )
    const gameData: GameData = {
      meta: {
        id: 'full-integration',
        createdAt: baseTimestamp,
        updatedAt: baseTimestamp,
        title: 'Full Integration Test',
        description: 'Full integration test data',
        version: '1.0.0',
        defaultSettings: {
          language: 'en',
          volume: 0.8,
        },
        languages: {
          en: { name: 'English', files: ['system.json'] },
        },
        initialState: {
          scene: 'start',
          map: 'world',
        },
        scenes: ['start', 'game'],
        styling: ['game.css', 'theme.css'],
        tileSets: ['outdoor'],
        maps: ['world'],
        items: [],
        appearanceCategories: [],
        appearances: [],
        virtualKeys: 'virtual-keys',
        virtualInputs: 'virtual-inputs',
      },
      languages: createLanguageMap({
        en: { name: 'English', files: ['system.json'] },
      }),
      scenes: [createScene('start'), createScene('game')],
      tileSets: [createTileSet('outdoor')],
      maps: [createMapData('world')],
      items: [],
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
    expect(resourceDataLogger.logResourceData).toHaveBeenCalled()
  })
})
