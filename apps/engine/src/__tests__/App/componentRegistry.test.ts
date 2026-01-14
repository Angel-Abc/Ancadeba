import { describe, it, expect, beforeEach } from 'vitest'
import { ComponentRegistry } from '../../App/Controls/componentRegistry'
import type { InventoryComponent } from '@ancadeba/schemas'

describe('ComponentRegistry', () => {
  let registry: ComponentRegistry

  beforeEach(() => {
    // Arrange
    registry = new ComponentRegistry()
  })

  it('should register and resolve a component', () => {
    // Arrange
    const mockComponent = (_props: { component: InventoryComponent }) => null

    // Act
    registry.register('inventory', mockComponent)
    const resolved = registry.resolve('inventory')

    // Assert
    expect(resolved).toBe(mockComponent)
  })

  it('should return undefined for unregistered component', () => {
    // Act
    const resolved = registry.resolve('menu')

    // Assert
    expect(resolved).toBeUndefined()
  })

  it('should check if component type exists', () => {
    // Arrange
    const mockComponent = (_props: { component: InventoryComponent }) => null
    registry.register('inventory', mockComponent)

    // Act & Assert
    expect(registry.has('inventory')).toBe(true)
    expect(registry.has('menu')).toBe(false)
  })
})
