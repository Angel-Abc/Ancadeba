import { describe, expect, it } from 'vitest'
import { SystemRegistry } from '../../ecs/systemRegistry'

describe('ecs/systemRegistry', () => {
  it('orders systems by priority', () => {
    // Arrange
    const registry = new SystemRegistry()
    const lowPrioritySystem = { start: () => {}, stop: () => {} }
    const highPrioritySystem = { start: () => {}, stop: () => {} }

    // Act
    registry.register(highPrioritySystem, { priority: 5 })
    registry.register(lowPrioritySystem, { priority: 1 })
    const systems = registry.getSystems()

    // Assert
    expect(systems).toEqual([lowPrioritySystem, highPrioritySystem])
  })

  it('keeps registration order for equal priorities', () => {
    // Arrange
    const registry = new SystemRegistry()
    const firstSystem = { start: () => {}, stop: () => {} }
    const secondSystem = { start: () => {}, stop: () => {} }

    // Act
    registry.register(firstSystem, { priority: 2 })
    registry.register(secondSystem, { priority: 2 })
    const systems = registry.getSystems()

    // Assert
    expect(systems).toEqual([firstSystem, secondSystem])
  })

  it('defaults priority to zero', () => {
    // Arrange
    const registry = new SystemRegistry()
    const lowestSystem = { start: () => {}, stop: () => {} }
    const defaultSystem = { start: () => {}, stop: () => {} }

    // Act
    registry.register(lowestSystem, { priority: -1 })
    registry.register(defaultSystem)
    const systems = registry.getSystems()

    // Assert
    expect(systems).toEqual([lowestSystem, defaultSystem])
  })
})
