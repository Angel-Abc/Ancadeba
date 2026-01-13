import { describe, expect, it, vi } from 'vitest'
import type { ILogger } from '@ancadeba/utils'
import type { Condition } from '@ancadeba/schemas'
import { HasItemConditionEvaluator } from '../../../core/conditionEvaluators/HasItemConditionEvaluator'
import type { IWorld } from '../../../ecs/world'
import { InventoryComponent } from '../../../ecs/components'

describe('core/conditionEvaluators/HasItemConditionEvaluator', () => {
  const createMockLogger = (): ILogger => ({
    debug: vi.fn(() => ''),
    info: vi.fn(() => ''),
    warn: vi.fn(() => ''),
    error: vi.fn(() => ''),
    fatal: vi.fn(() => {
      throw new Error('fatal')
    }),
  })

  const createMockWorld = (): IWorld => ({
    createEntity: vi.fn(() => 1),
    destroyEntity: vi.fn(),
    hasEntity: vi.fn(() => true),
    setComponent: vi.fn(),
    removeComponent: vi.fn(),
    getComponent: vi.fn(),
    getEntitiesWith: vi.fn(() => []),
    subscribe: vi.fn(() => () => undefined),
  })

  it('canEvaluate returns true for has-item conditions', () => {
    // Arrange
    const logger = createMockLogger()
    const world = createMockWorld()
    const evaluator = new HasItemConditionEvaluator(logger, world)
    const condition: Condition = {
      type: 'has-item',
      itemId: 'apple',
      quantity: 1,
    }

    // Act
    const result = evaluator.canEvaluate(condition)

    // Assert
    expect(result).toBe(true)
  })

  it('canEvaluate returns false for other condition types', () => {
    // Arrange
    const logger = createMockLogger()
    const world = createMockWorld()
    const evaluator = new HasItemConditionEvaluator(logger, world)
    const condition: Condition = {
      type: 'flag',
      name: 'test-flag',
      value: true,
    }

    // Act
    const result = evaluator.canEvaluate(condition)

    // Assert
    expect(result).toBe(false)
  })

  it('returns true when player has exact quantity of item', () => {
    // Arrange
    const logger = createMockLogger()
    const world = createMockWorld()
    const evaluator = new HasItemConditionEvaluator(logger, world)

    const inventory: InventoryComponent = {
      items: [{ itemId: 'apple', quantity: 3 }],
    }
    vi.mocked(world.getEntitiesWith).mockReturnValue([1])
    vi.mocked(world.getComponent).mockReturnValue(inventory)

    const condition: Condition = {
      type: 'has-item',
      itemId: 'apple',
      quantity: 3,
    }

    // Act
    const result = evaluator.evaluate(condition)

    // Assert
    expect(result).toBe(true)
  })

  it('returns true when player has more than required quantity', () => {
    // Arrange
    const logger = createMockLogger()
    const world = createMockWorld()
    const evaluator = new HasItemConditionEvaluator(logger, world)

    const inventory: InventoryComponent = {
      items: [{ itemId: 'brass-key', quantity: 5 }],
    }
    vi.mocked(world.getEntitiesWith).mockReturnValue([1])
    vi.mocked(world.getComponent).mockReturnValue(inventory)

    const condition: Condition = {
      type: 'has-item',
      itemId: 'brass-key',
      quantity: 2,
    }

    // Act
    const result = evaluator.evaluate(condition)

    // Assert
    expect(result).toBe(true)
  })

  it('returns false when player has insufficient quantity', () => {
    // Arrange
    const logger = createMockLogger()
    const world = createMockWorld()
    const evaluator = new HasItemConditionEvaluator(logger, world)

    const inventory: InventoryComponent = {
      items: [{ itemId: 'health-potion', quantity: 1 }],
    }
    vi.mocked(world.getEntitiesWith).mockReturnValue([1])
    vi.mocked(world.getComponent).mockReturnValue(inventory)

    const condition: Condition = {
      type: 'has-item',
      itemId: 'health-potion',
      quantity: 3,
    }

    // Act
    const result = evaluator.evaluate(condition)

    // Assert
    expect(result).toBe(false)
  })

  it('returns false when item does not exist in inventory', () => {
    // Arrange
    const logger = createMockLogger()
    const world = createMockWorld()
    const evaluator = new HasItemConditionEvaluator(logger, world)

    const inventory: InventoryComponent = {
      items: [{ itemId: 'apple', quantity: 5 }],
    }
    vi.mocked(world.getEntitiesWith).mockReturnValue([1])
    vi.mocked(world.getComponent).mockReturnValue(inventory)

    const condition: Condition = {
      type: 'has-item',
      itemId: 'brass-key',
      quantity: 1,
    }

    // Act
    const result = evaluator.evaluate(condition)

    // Assert
    expect(result).toBe(false)
  })

  it('returns false and warns when player entity not found', () => {
    // Arrange
    const logger = createMockLogger()
    const world = createMockWorld()
    const evaluator = new HasItemConditionEvaluator(logger, world)

    vi.mocked(world.getEntitiesWith).mockReturnValue([])

    const condition: Condition = {
      type: 'has-item',
      itemId: 'apple',
      quantity: 1,
    }

    // Act
    const result = evaluator.evaluate(condition)

    // Assert
    expect(result).toBe(false)
    expect(logger.warn).toHaveBeenCalledWith(
      'engine/core/conditionEvaluators/HasItemConditionEvaluator',
      'No player entity found'
    )
  })

  it('returns false and warns when player has no inventory component', () => {
    // Arrange
    const logger = createMockLogger()
    const world = createMockWorld()
    const evaluator = new HasItemConditionEvaluator(logger, world)

    vi.mocked(world.getEntitiesWith).mockReturnValue([1])
    vi.mocked(world.getComponent).mockReturnValue(undefined)

    const condition: Condition = {
      type: 'has-item',
      itemId: 'apple',
      quantity: 1,
    }

    // Act
    const result = evaluator.evaluate(condition)

    // Assert
    expect(result).toBe(false)
    expect(logger.warn).toHaveBeenCalledWith(
      'engine/core/conditionEvaluators/HasItemConditionEvaluator',
      'Player has no inventory component'
    )
  })

  it('uses default quantity of 1 when not specified', () => {
    // Arrange
    const logger = createMockLogger()
    const world = createMockWorld()
    const evaluator = new HasItemConditionEvaluator(logger, world)

    const inventory: InventoryComponent = {
      items: [{ itemId: 'wooden-sword', quantity: 1 }],
    }
    vi.mocked(world.getEntitiesWith).mockReturnValue([1])
    vi.mocked(world.getComponent).mockReturnValue(inventory)

    const condition: Condition = {
      type: 'has-item',
      itemId: 'wooden-sword',
      quantity: 1,
    }

    // Act
    const result = evaluator.evaluate(condition)

    // Assert
    expect(result).toBe(true)
  })

  it('returns false for non-has-item conditions', () => {
    // Arrange
    const logger = createMockLogger()
    const world = createMockWorld()
    const evaluator = new HasItemConditionEvaluator(logger, world)

    const condition: Condition = {
      type: 'flag',
      name: 'test-flag',
      value: true,
    }

    // Act
    const result = evaluator.evaluate(condition)

    // Assert
    expect(result).toBe(false)
    expect(world.getEntitiesWith).not.toHaveBeenCalled()
  })

  it('handles inventory with multiple items correctly', () => {
    // Arrange
    const logger = createMockLogger()
    const world = createMockWorld()
    const evaluator = new HasItemConditionEvaluator(logger, world)

    const inventory: InventoryComponent = {
      items: [
        { itemId: 'apple', quantity: 5 },
        { itemId: 'brass-key', quantity: 1 },
        { itemId: 'health-potion', quantity: 3 },
      ],
    }
    vi.mocked(world.getEntitiesWith).mockReturnValue([1])
    vi.mocked(world.getComponent).mockReturnValue(inventory)

    const condition: Condition = {
      type: 'has-item',
      itemId: 'brass-key',
      quantity: 1,
    }

    // Act
    const result = evaluator.evaluate(condition)

    // Assert
    expect(result).toBe(true)
  })
})
