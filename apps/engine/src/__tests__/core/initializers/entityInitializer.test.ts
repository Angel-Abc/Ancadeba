import { describe, expect, it } from 'vitest'
import type { GameData } from '@ancadeba/schemas'
import {
  COMPONENT_KEYS,
  createPlayerTag,
  PositionComponent,
  InventoryComponent,
} from '../../../ecs/components'
import { World, WorldEventBus } from '../../../ecs/world'
import { EntityInitializer } from '../../../core/initializers/entityInitializer'

describe('core/initializers/entityInitializer', () => {
  const createMinimalGameData = (): GameData => ({
    meta: {
      title: 'Test Game',
      initialState: {
        scene: 'start-scene',
      },
    },
    scenes: [],
    maps: [],
    tileSets: [],
  })

  it('does nothing when mapPosition is missing', () => {
    // Arrange
    const world = new World(new WorldEventBus())
    const initializer = new EntityInitializer(world)
    const gameData = createMinimalGameData()

    // Act
    initializer.initializeEntities(gameData)

    // Assert
    expect(world.getEntitiesWith(COMPONENT_KEYS.player)).toEqual([])
    expect(world.getEntitiesWith(COMPONENT_KEYS.position)).toEqual([])
  })

  it('creates a player entity with position from initial state', () => {
    // Arrange
    const world = new World(new WorldEventBus())
    const initializer = new EntityInitializer(world)
    const gameData = createMinimalGameData()
    gameData.meta.initialState.mapPosition = { x: 2, y: 3 }

    // Act
    initializer.initializeEntities(gameData)

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
    expect(position).toEqual({ x: 2, y: 3 })
  })

  it('updates existing player position from initial state', () => {
    // Arrange
    const world = new World(new WorldEventBus())
    const initializer = new EntityInitializer(world)
    const gameData = createMinimalGameData()
    gameData.meta.initialState.mapPosition = { x: 10, y: 20 }

    const entityId = world.createEntity()
    world.setComponent(entityId, COMPONENT_KEYS.player, createPlayerTag())
    world.setComponent(entityId, COMPONENT_KEYS.position, { x: 1, y: 1 })

    // Act
    initializer.initializeEntities(gameData)

    // Assert
    const playerEntities = world.getEntitiesWith(COMPONENT_KEYS.player)
    expect(playerEntities).toEqual([entityId])
    const position = world.getComponent<PositionComponent>(
      entityId,
      COMPONENT_KEYS.position
    )
    expect(position).toEqual({ x: 10, y: 20 })
  })

  it('creates player entity with inventory component', () => {
    // Arrange
    const world = new World(new WorldEventBus())
    const initializer = new EntityInitializer(world)
    const gameData = createMinimalGameData()
    gameData.meta.initialState.mapPosition = { x: 5, y: 5 }

    // Act
    initializer.initializeEntities(gameData)

    // Assert
    const [playerEntityId] = world.getEntitiesWith(COMPONENT_KEYS.player)
    expect(playerEntityId).toBeDefined()
    if (!playerEntityId) {
      return
    }
    const inventory = world.getComponent<InventoryComponent>(
      playerEntityId,
      COMPONENT_KEYS.inventory
    )
    expect(inventory).toBeDefined()
    expect(inventory?.items).toEqual([])
  })
})
