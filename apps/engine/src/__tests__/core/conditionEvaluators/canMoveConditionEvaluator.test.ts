import { describe, expect, it, vi } from 'vitest'
import type { Condition, Tile } from '@ancadeba/schemas'
import type { ILogger } from '@ancadeba/utils'
import type { IGameStateReader } from '../../../gameState.ts/storage'
import type { GameState } from '../../../gameState.ts/types'
import type { IResourceDataProvider } from '../../../resourceData/provider'
import type { MapData } from '../../../resourceData/types'
import { CanMoveConditionEvaluator } from '../../../core/conditionEvaluators/CanMoveConditionEvaluator'

const logName = 'engine/core/conditionEvaluators/CanMoveConditionEvaluator'

const createMockLogger = (): ILogger => ({
  debug: vi.fn(() => ''),
  info: vi.fn(() => ''),
  warn: vi.fn(() => ''),
  error: vi.fn(() => ''),
  fatal: vi.fn(() => {
    throw new Error('fatal')
  }),
})

const createGameState = (overrides: Partial<GameState> = {}): GameState => ({
  title: 'Test Game',
  activeSceneId: 'scene-1',
  activeMapId: null,
  flags: {},
  values: {},
  sceneStack: [],
  ...overrides,
})

const createGameStateReader = (state: GameState): IGameStateReader => ({
  get state() {
    return state
  },
  get activeSceneId() {
    return state.activeSceneId
  },
  get activeMapId() {
    return state.activeMapId
  },
})

const createResourceDataProvider = (): IResourceDataProvider => ({
  assetsUrl: 'assets',
  getSceneData: vi.fn(),
  getCssFilePaths: vi.fn().mockReturnValue([]),
  getMapData: vi.fn(),
  getItemData: vi.fn(),
  getComponentDefinition: vi.fn(),
  hasComponentDefinition: vi.fn(() => false),
  resolveComponent: vi.fn((c) => c),
  getAppearanceCategoryData: vi.fn(),
  getAppearanceData: vi.fn(),
  getAllAppearanceCategories: vi.fn(() => []),
  getAppearancesByCategory: vi.fn(() => []),
  getLanguageFilePaths: vi.fn().mockReturnValue([]),
})

const createMapData = (overrides: Partial<MapData> = {}): MapData => ({
  id: 'map-1',
  width: 2,
  height: 1,
  tiles: new Map<string, Tile>([
    ['tile-a', { id: 'tile-a', walkable: true }],
    ['tile-b', { id: 'tile-b', walkable: false }],
  ]),
  squares: [['tile-a', 'tile-b']],
  ...overrides,
})

describe('core/conditionEvaluators/CanMoveConditionEvaluator', () => {
  it('canEvaluate returns true for supported move conditions', () => {
    // Arrange
    const logger = createMockLogger()
    const state = createGameState({
      activeMapId: 'map-1',
      mapPosition: { x: 0, y: 0 },
    })
    const resourceDataProvider = createResourceDataProvider()
    const evaluator = new CanMoveConditionEvaluator(
      logger,
      createGameStateReader(state),
      resourceDataProvider
    )
    const conditions: Condition[] = [
      { type: 'can-move-up' },
      { type: 'can-move-down' },
      { type: 'can-move-left' },
      { type: 'can-move-right' },
    ]

    // Act
    const results = conditions.map((condition) =>
      evaluator.canEvaluate(condition)
    )

    // Assert
    expect(results).toEqual([true, true, true, true])
  })

  it('canEvaluate returns false for unsupported condition types', () => {
    // Arrange
    const logger = createMockLogger()
    const state = createGameState({
      activeMapId: 'map-1',
      mapPosition: { x: 0, y: 0 },
    })
    const resourceDataProvider = createResourceDataProvider()
    const evaluator = new CanMoveConditionEvaluator(
      logger,
      createGameStateReader(state),
      resourceDataProvider
    )
    const condition = { type: 'flag', name: 'test', value: true } as Condition

    // Act
    const result = evaluator.canEvaluate(condition)

    // Assert
    expect(result).toBe(false)
  })

  it('returns false when map position is missing', () => {
    // Arrange
    const logger = createMockLogger()
    const state = createGameState({ activeMapId: 'map-1' })
    const resourceDataProvider = createResourceDataProvider()
    const evaluator = new CanMoveConditionEvaluator(
      logger,
      createGameStateReader(state),
      resourceDataProvider
    )
    const condition: Condition = { type: 'can-move-right' }

    // Act
    const result = evaluator.evaluate(condition)

    // Assert
    expect(result).toBe(false)
    expect(logger.warn).toHaveBeenCalledWith(
      logName,
      'Map position is not defined'
    )
  })

  it('returns false when active map id is missing', () => {
    // Arrange
    const logger = createMockLogger()
    const state = createGameState({ mapPosition: { x: 0, y: 0 } })
    const resourceDataProvider = createResourceDataProvider()
    const evaluator = new CanMoveConditionEvaluator(
      logger,
      createGameStateReader(state),
      resourceDataProvider
    )
    const condition: Condition = { type: 'can-move-right' }

    // Act
    const result = evaluator.evaluate(condition)

    // Assert
    expect(result).toBe(false)
    expect(logger.warn).toHaveBeenCalledWith(logName, 'Active map is not set')
  })

  it('returns false when map data is missing', () => {
    // Arrange
    const logger = createMockLogger()
    const state = createGameState({
      activeMapId: 'map-1',
      mapPosition: { x: 0, y: 0 },
    })
    const resourceDataProvider = createResourceDataProvider()
    vi.mocked(resourceDataProvider.getMapData).mockImplementation(() => {
      throw new Error('missing')
    })
    const evaluator = new CanMoveConditionEvaluator(
      logger,
      createGameStateReader(state),
      resourceDataProvider
    )
    const condition: Condition = { type: 'can-move-right' }

    // Act
    const result = evaluator.evaluate(condition)

    // Assert
    expect(result).toBe(false)
    expect(logger.warn).toHaveBeenCalledWith(
      logName,
      'Map data not found for id "{0}"',
      'map-1'
    )
  })

  it('returns false when target is out of bounds', () => {
    // Arrange
    const logger = createMockLogger()
    const state = createGameState({
      activeMapId: 'map-1',
      mapPosition: { x: 0, y: 0 },
    })
    const resourceDataProvider = createResourceDataProvider()
    vi.mocked(resourceDataProvider.getMapData).mockReturnValue(
      createMapData({ width: 1, height: 1, squares: [['tile-a']] })
    )
    const evaluator = new CanMoveConditionEvaluator(
      logger,
      createGameStateReader(state),
      resourceDataProvider
    )
    const condition: Condition = { type: 'can-move-left' }

    // Act
    const result = evaluator.evaluate(condition)

    // Assert
    expect(result).toBe(false)
  })

  it('returns false when target row is missing', () => {
    // Arrange
    const logger = createMockLogger()
    const state = createGameState({
      activeMapId: 'map-1',
      mapPosition: { x: 0, y: 0 },
    })
    const resourceDataProvider = createResourceDataProvider()
    vi.mocked(resourceDataProvider.getMapData).mockReturnValue(
      createMapData({
        width: 1,
        height: 2,
        squares: [['tile-a']],
      })
    )
    const evaluator = new CanMoveConditionEvaluator(
      logger,
      createGameStateReader(state),
      resourceDataProvider
    )
    const condition: Condition = { type: 'can-move-down' }

    // Act
    const result = evaluator.evaluate(condition)

    // Assert
    expect(result).toBe(false)
    expect(logger.warn).toHaveBeenCalledWith(
      logName,
      'Map row is missing at y={0}',
      1
    )
  })

  it('returns false when target tile is missing', () => {
    // Arrange
    const logger = createMockLogger()
    const state = createGameState({
      activeMapId: 'map-1',
      mapPosition: { x: 0, y: 0 },
    })
    const resourceDataProvider = createResourceDataProvider()
    vi.mocked(resourceDataProvider.getMapData).mockReturnValue(
      createMapData({ squares: [['tile-a']] })
    )
    const evaluator = new CanMoveConditionEvaluator(
      logger,
      createGameStateReader(state),
      resourceDataProvider
    )
    const condition: Condition = { type: 'can-move-right' }

    // Act
    const result = evaluator.evaluate(condition)

    // Assert
    expect(result).toBe(false)
    expect(logger.warn).toHaveBeenCalledWith(
      logName,
      'Map tile is missing at x={0}, y={1}',
      1,
      0
    )
  })

  it('returns false when tile data is missing', () => {
    // Arrange
    const logger = createMockLogger()
    const state = createGameState({
      activeMapId: 'map-1',
      mapPosition: { x: 0, y: 0 },
    })
    const resourceDataProvider = createResourceDataProvider()
    vi.mocked(resourceDataProvider.getMapData).mockReturnValue(
      createMapData({
        width: 2,
        height: 1,
        squares: [['tile-a', 'tile-missing']],
        tiles: new Map([['tile-a', { id: 'tile-a', walkable: true }]]),
      })
    )
    const evaluator = new CanMoveConditionEvaluator(
      logger,
      createGameStateReader(state),
      resourceDataProvider
    )
    const condition: Condition = { type: 'can-move-right' }

    // Act
    const result = evaluator.evaluate(condition)

    // Assert
    expect(result).toBe(false)
    expect(logger.warn).toHaveBeenCalledWith(
      logName,
      'Tile data not found for key "{0}"',
      'tile-missing'
    )
  })

  it('returns false when target tile is not walkable', () => {
    // Arrange
    const logger = createMockLogger()
    const state = createGameState({
      activeMapId: 'map-1',
      mapPosition: { x: 0, y: 0 },
    })
    const resourceDataProvider = createResourceDataProvider()
    vi.mocked(resourceDataProvider.getMapData).mockReturnValue(createMapData())
    const evaluator = new CanMoveConditionEvaluator(
      logger,
      createGameStateReader(state),
      resourceDataProvider
    )
    const condition: Condition = { type: 'can-move-right' }

    // Act
    const result = evaluator.evaluate(condition)

    // Assert
    expect(result).toBe(false)
  })

  it('returns true when target tile is walkable', () => {
    // Arrange
    const logger = createMockLogger()
    const state = createGameState({
      activeMapId: 'map-1',
      mapPosition: { x: 0, y: 0 },
    })
    const resourceDataProvider = createResourceDataProvider()
    vi.mocked(resourceDataProvider.getMapData).mockReturnValue(
      createMapData({ squares: [['tile-a', 'tile-a']] })
    )
    const evaluator = new CanMoveConditionEvaluator(
      logger,
      createGameStateReader(state),
      resourceDataProvider
    )
    const condition: Condition = { type: 'can-move-right' }

    // Act
    const result = evaluator.evaluate(condition)

    // Assert
    expect(result).toBe(true)
  })

  it('returns false when condition type is unsupported', () => {
    // Arrange
    const logger = createMockLogger()
    const state = createGameState({
      activeMapId: 'map-1',
      mapPosition: { x: 0, y: 0 },
    })
    const resourceDataProvider = createResourceDataProvider()
    vi.mocked(resourceDataProvider.getMapData).mockReturnValue(createMapData())
    const evaluator = new CanMoveConditionEvaluator(
      logger,
      createGameStateReader(state),
      resourceDataProvider
    )
    const condition = { type: 'flag', name: 'test', value: true } as Condition

    // Act
    const result = evaluator.evaluate(condition)

    // Assert
    expect(result).toBe(false)
  })
})
