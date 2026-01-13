import { describe, expect, it, vi } from 'vitest'
import type { ILogger } from '@ancadeba/utils'
import type { IEngineMessageBus } from '../../system/engineMessageBus'
import type {
  IGameStateMutator,
  IGameStateReader,
} from '../../gameState.ts/storage'
import type { GameState } from '../../gameState.ts/types'
import { CORE_MESSAGES } from '../../messages/core'
import {
  COMPONENT_KEYS,
  createPlayerTag,
  PositionComponent,
} from '../../ecs/components'
import { MapPositionBridgeSystem } from '../../ecs/systems/mapPositionBridgeSystem'
import { World, WorldEventBus } from '../../ecs/world'

const createLogger = (): ILogger => ({
  debug: vi.fn().mockReturnValue(''),
  info: vi.fn().mockReturnValue(''),
  warn: vi.fn().mockReturnValue(''),
  error: vi.fn().mockReturnValue(''),
  fatal: vi.fn(() => {
    throw new Error('fatal')
  }),
})

const createGameState = (overrides: Partial<GameState> = {}): GameState => ({
  title: '',
  activeSceneId: '',
  activeMapId: null,
  flags: {},
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

const createGameStateMutator = (): IGameStateMutator => ({
  update: vi.fn(),
  set state(_value: GameState) {},
})

describe('ecs/systems/mapPositionBridgeSystem', () => {
  it('creates a player entity from initial map position', () => {
    // Arrange
    const state = createGameState({ mapPosition: { x: 1, y: 2 } })
    const gameStateReader = createGameStateReader(state)
    const gameStateMutator = createGameStateMutator()
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: vi.fn(),
      subscribeRaw: vi.fn(),
    }
    const world = new World(new WorldEventBus())
    const system = new MapPositionBridgeSystem(
      createLogger(),
      messageBus,
      gameStateReader,
      gameStateMutator,
      world
    )

    // Act
    system.start()

    // Assert
    const [playerEntityId] = world.getEntitiesWith(COMPONENT_KEYS.player)
    expect(playerEntityId).toBeDefined()
    if (!playerEntityId) {
      return
    }
    const position = world.getComponent<PositionComponent>(
      playerEntityId,
      COMPONENT_KEYS.position
    )
    expect(position).toEqual({ x: 1, y: 2 })
  })

  it('logs warning when map position is missing', () => {
    // Arrange
    const state = createGameState()
    const gameStateReader = createGameStateReader(state)
    const gameStateMutator = createGameStateMutator()
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: vi.fn(),
      subscribeRaw: vi.fn(),
    }
    const logger = createLogger()
    const world = new World(new WorldEventBus())
    const system = new MapPositionBridgeSystem(
      logger,
      messageBus,
      gameStateReader,
      gameStateMutator,
      world
    )

    // Act
    system.start()

    // Assert
    expect(logger.warn).toHaveBeenCalledWith(
      'engine/ecs/systems/MapPositionBridgeSystem',
      'Map position is not defined'
    )
    expect(world.getEntitiesWith(COMPONENT_KEYS.player)).toEqual([])
  })

  it('sets player position when player entity exists without one', () => {
    // Arrange
    const state = createGameState({ mapPosition: { x: 4, y: 7 } })
    const gameStateReader = createGameStateReader(state)
    const gameStateMutator = createGameStateMutator()
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: vi.fn(),
      subscribeRaw: vi.fn(),
    }
    const world = new World(new WorldEventBus())
    const entityId = world.createEntity()
    world.setComponent(entityId, COMPONENT_KEYS.player, createPlayerTag())
    const system = new MapPositionBridgeSystem(
      createLogger(),
      messageBus,
      gameStateReader,
      gameStateMutator,
      world
    )

    // Act
    system.start()

    // Assert
    const playerEntities = world.getEntitiesWith(COMPONENT_KEYS.player)
    expect(playerEntities).toHaveLength(1)
    expect(playerEntities[0]).toBe(entityId)
    const position = world.getComponent<PositionComponent>(
      entityId,
      COMPONENT_KEYS.position
    )
    expect(position).toEqual({ x: 4, y: 7 })
  })

  it('updates game state and publishes when player position changes', () => {
    // Arrange
    const state = createGameState({ mapPosition: { x: 0, y: 0 } })
    const gameStateReader = createGameStateReader(state)
    const gameStateMutator = createGameStateMutator()
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: vi.fn(),
      subscribeRaw: vi.fn(),
    }
    const world = new World(new WorldEventBus())
    const entityId = world.createEntity()
    world.setComponent(entityId, COMPONENT_KEYS.player, createPlayerTag())
    world.setComponent<PositionComponent>(entityId, COMPONENT_KEYS.position, {
      x: 0,
      y: 0,
    })
    const system = new MapPositionBridgeSystem(
      createLogger(),
      messageBus,
      gameStateReader,
      gameStateMutator,
      world
    )

    // Act
    system.start()
    world.setComponent(entityId, COMPONENT_KEYS.position, { x: 5, y: 6 })

    // Assert
    expect(gameStateMutator.update).toHaveBeenCalledWith({
      mapPosition: { x: 5, y: 6 },
    })
    expect(messageBus.publish).toHaveBeenCalledWith(
      CORE_MESSAGES.MAP_POSITION_CHANGED,
      { mapPosition: { x: 5, y: 6 } }
    )
  })

  it('ignores position updates for non-player entities', () => {
    // Arrange
    const state = createGameState({ mapPosition: { x: 2, y: 2 } })
    const gameStateReader = createGameStateReader(state)
    const gameStateMutator = createGameStateMutator()
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: vi.fn(),
      subscribeRaw: vi.fn(),
    }
    const world = new World(new WorldEventBus())
    const system = new MapPositionBridgeSystem(
      createLogger(),
      messageBus,
      gameStateReader,
      gameStateMutator,
      world
    )

    // Act
    system.start()
    vi.clearAllMocks()
    const entityId = world.createEntity()
    world.setComponent<PositionComponent>(entityId, COMPONENT_KEYS.position, {
      x: 9,
      y: 9,
    })

    // Assert
    expect(gameStateMutator.update).not.toHaveBeenCalled()
    expect(messageBus.publish).not.toHaveBeenCalled()
  })

  it('stops forwarding after stop is called', () => {
    // Arrange
    const state = createGameState({ mapPosition: { x: 1, y: 1 } })
    const gameStateReader = createGameStateReader(state)
    const gameStateMutator = createGameStateMutator()
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: vi.fn(),
      subscribeRaw: vi.fn(),
    }
    const world = new World(new WorldEventBus())
    const entityId = world.createEntity()
    world.setComponent(entityId, COMPONENT_KEYS.player, createPlayerTag())
    world.setComponent<PositionComponent>(entityId, COMPONENT_KEYS.position, {
      x: 1,
      y: 1,
    })
    const system = new MapPositionBridgeSystem(
      createLogger(),
      messageBus,
      gameStateReader,
      gameStateMutator,
      world
    )

    // Act
    system.start()
    vi.clearAllMocks()
    system.stop()
    world.setComponent(entityId, COMPONENT_KEYS.position, { x: 2, y: 2 })

    // Assert
    expect(gameStateMutator.update).not.toHaveBeenCalled()
    expect(messageBus.publish).not.toHaveBeenCalled()
  })
})
