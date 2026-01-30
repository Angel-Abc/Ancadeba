import { describe, it, expect, beforeEach } from 'vitest'
import { World } from '../World'
import type { Component, System } from '../types'

// Test component classes
class Position implements Component {
  constructor(
    public x: number,
    public y: number,
  ) {}
}

class Velocity implements Component {
  constructor(
    public dx: number,
    public dy: number,
  ) {}
}

class Health implements Component {
  constructor(public value: number) {}
}

describe('World', () => {
  let world: World

  beforeEach(() => {
    world = new World()
  })

  describe('Entity Management', () => {
    it('should create entities with deterministic incrementing IDs', () => {
      // Arrange & Act
      const entity1 = world.createEntity()
      const entity2 = world.createEntity()
      const entity3 = world.createEntity()

      // Assert
      expect(entity1).toBe(1)
      expect(entity2).toBe(2)
      expect(entity3).toBe(3)
    })

    it('should track created entities', () => {
      // Arrange & Act
      const entity1 = world.createEntity()
      const entity2 = world.createEntity()

      // Assert
      expect(world.hasEntity(entity1)).toBe(true)
      expect(world.hasEntity(entity2)).toBe(true)
      expect(world.hasEntity(999)).toBe(false)
    })

    it('should return all entities', () => {
      // Arrange
      const entity1 = world.createEntity()
      const entity2 = world.createEntity()
      const entity3 = world.createEntity()

      // Act
      const entities = world.getEntities()

      // Assert
      expect(entities).toEqual([entity1, entity2, entity3])
    })

    it('should destroy entities', () => {
      // Arrange
      const entity = world.createEntity()

      // Act
      world.destroyEntity(entity)

      // Assert
      expect(world.hasEntity(entity)).toBe(false)
    })

    it('should handle destroying non-existent entities gracefully', () => {
      // Arrange & Act & Assert
      expect(() => world.destroyEntity(999)).not.toThrow()
    })

    it('should remove all components when destroying an entity', () => {
      // Arrange
      const entity = world.createEntity()
      world.addComponent(entity, Position, new Position(10, 20))
      world.addComponent(entity, Velocity, new Velocity(1, 2))

      // Act
      world.destroyEntity(entity)

      // Assert
      expect(world.getComponent(entity, Position)).toBeUndefined()
      expect(world.getComponent(entity, Velocity)).toBeUndefined()
    })
  })

  describe('Component Management', () => {
    it('should add components to entities', () => {
      // Arrange
      const entity = world.createEntity()
      const position = new Position(10, 20)

      // Act
      world.addComponent(entity, Position, position)

      // Assert
      expect(world.hasComponent(entity, Position)).toBe(true)
      expect(world.getComponent(entity, Position)).toBe(position)
    })

    it('should throw when adding component to non-existent entity', () => {
      // Arrange
      const position = new Position(10, 20)

      // Act & Assert
      expect(() => world.addComponent(999, Position, position)).toThrow(
        'Entity 999 does not exist',
      )
    })

    it('should replace existing component of same type', () => {
      // Arrange
      const entity = world.createEntity()
      const position1 = new Position(10, 20)
      const position2 = new Position(30, 40)

      // Act
      world.addComponent(entity, Position, position1)
      world.addComponent(entity, Position, position2)

      // Assert
      expect(world.getComponent(entity, Position)).toBe(position2)
    })

    it('should remove components from entities', () => {
      // Arrange
      const entity = world.createEntity()
      world.addComponent(entity, Position, new Position(10, 20))

      // Act
      world.removeComponent(entity, Position)

      // Assert
      expect(world.hasComponent(entity, Position)).toBe(false)
      expect(world.getComponent(entity, Position)).toBeUndefined()
    })

    it('should handle removing non-existent components gracefully', () => {
      // Arrange
      const entity = world.createEntity()

      // Act & Assert
      expect(() => world.removeComponent(entity, Position)).not.toThrow()
    })

    it('should get component from entity', () => {
      // Arrange
      const entity = world.createEntity()
      const position = new Position(10, 20)
      world.addComponent(entity, Position, position)

      // Act
      const retrieved = world.getComponent(entity, Position)

      // Assert
      expect(retrieved).toBe(position)
      expect(retrieved?.x).toBe(10)
      expect(retrieved?.y).toBe(20)
    })

    it('should return undefined for non-existent component', () => {
      // Arrange
      const entity = world.createEntity()

      // Act
      const component = world.getComponent(entity, Position)

      // Assert
      expect(component).toBeUndefined()
    })

    it('should check if entity has component', () => {
      // Arrange
      const entity = world.createEntity()
      world.addComponent(entity, Position, new Position(10, 20))

      // Act & Assert
      expect(world.hasComponent(entity, Position)).toBe(true)
      expect(world.hasComponent(entity, Velocity)).toBe(false)
    })
  })

  describe('Entity Queries', () => {
    it('should query entities with specific component', () => {
      // Arrange
      const entity1 = world.createEntity()
      const entity2 = world.createEntity()
      const entity3 = world.createEntity()

      world.addComponent(entity1, Position, new Position(10, 20))
      world.addComponent(entity2, Position, new Position(30, 40))
      world.addComponent(entity3, Velocity, new Velocity(1, 2))

      // Act
      const entitiesWithPosition = world.queryEntities(Position)

      // Assert
      expect(entitiesWithPosition).toHaveLength(2)
      expect(entitiesWithPosition).toContain(entity1)
      expect(entitiesWithPosition).toContain(entity2)
      expect(entitiesWithPosition).not.toContain(entity3)
    })

    it('should return empty array when querying non-existent component', () => {
      // Arrange
      world.createEntity()

      // Act
      const entities = world.queryEntities(Position)

      // Assert
      expect(entities).toEqual([])
    })

    it('should query entities with all specified components', () => {
      // Arrange
      const entity1 = world.createEntity()
      const entity2 = world.createEntity()
      const entity3 = world.createEntity()

      world.addComponent(entity1, Position, new Position(10, 20))
      world.addComponent(entity1, Velocity, new Velocity(1, 2))

      world.addComponent(entity2, Position, new Position(30, 40))
      world.addComponent(entity2, Health, new Health(100))

      world.addComponent(entity3, Position, new Position(50, 60))
      world.addComponent(entity3, Velocity, new Velocity(3, 4))
      world.addComponent(entity3, Health, new Health(200))

      // Act
      const entitiesWithPositionAndVelocity = world.queryEntitiesWithAll([
        Position,
        Velocity,
      ])
      const entitiesWithAll = world.queryEntitiesWithAll([
        Position,
        Velocity,
        Health,
      ])

      // Assert
      expect(entitiesWithPositionAndVelocity).toHaveLength(2)
      expect(entitiesWithPositionAndVelocity).toContain(entity1)
      expect(entitiesWithPositionAndVelocity).toContain(entity3)

      expect(entitiesWithAll).toHaveLength(1)
      expect(entitiesWithAll).toContain(entity3)
    })

    it('should return empty array when querying with empty component list', () => {
      // Arrange
      world.createEntity()

      // Act
      const entities = world.queryEntitiesWithAll([])

      // Assert
      expect(entities).toEqual([])
    })

    it('should return empty array when querying with component that has no entities', () => {
      // Arrange
      const entity = world.createEntity()
      world.addComponent(entity, Position, new Position(10, 20))

      // Act
      const entities = world.queryEntitiesWithAll([Position, Velocity])

      // Assert
      expect(entities).toEqual([])
    })
  })

  describe('System Management', () => {
    it('should register and update systems', () => {
      // Arrange
      let updateCount = 0

      const testSystem: System = {
        update() {
          updateCount++
        },
      }

      world.addSystem(testSystem)

      // Act
      world.update()

      // Assert
      expect(updateCount).toBe(1)
    })

    it('should update multiple systems in order', () => {
      // Arrange
      const updateOrder: number[] = []

      const system1: System = {
        update() {
          updateOrder.push(1)
        },
      }

      const system2: System = {
        update() {
          updateOrder.push(2)
        },
      }

      const system3: System = {
        update() {
          updateOrder.push(3)
        },
      }

      world.addSystem(system1)
      world.addSystem(system2)
      world.addSystem(system3)

      // Act
      world.update()

      // Assert
      expect(updateOrder).toEqual([1, 2, 3])
    })

    it('should remove systems', () => {
      // Arrange
      let updateCount = 0

      const testSystem: System = {
        update() {
          updateCount++
        },
      }

      world.addSystem(testSystem)
      world.update()

      // Act
      world.removeSystem(testSystem)
      world.update()

      // Assert
      expect(updateCount).toBe(1)
    })

    it('should handle removing non-existent systems gracefully', () => {
      // Arrange
      const testSystem: System = {
        update() {},
      }

      // Act & Assert
      expect(() => world.removeSystem(testSystem)).not.toThrow()
    })
  })

  describe('Clear', () => {
    it('should clear all entities, components, and systems', () => {
      // Arrange
      const entity1 = world.createEntity()
      const entity2 = world.createEntity()
      world.addComponent(entity1, Position, new Position(10, 20))
      world.addComponent(entity2, Velocity, new Velocity(1, 2))

      let updateCount = 0
      const testSystem: System = {
        update() {
          updateCount++
        },
      }
      world.addSystem(testSystem)

      // Act
      world.clear()

      // Assert
      expect(world.getEntities()).toEqual([])
      expect(world.hasEntity(entity1)).toBe(false)
      expect(world.hasEntity(entity2)).toBe(false)

      world.update()
      expect(updateCount).toBe(0)
    })

    it('should reset entity ID generation after clear', () => {
      // Arrange
      world.createEntity()
      world.createEntity()
      world.clear()

      // Act
      const newEntity = world.createEntity()

      // Assert
      expect(newEntity).toBe(1)
    })
  })
})
