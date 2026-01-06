import { describe, it, expect, beforeEach } from 'vitest'
import { ComponentRegistry } from '../../App/Controls/componentRegistry'

describe('ComponentRegistry', () => {
  let registry: ComponentRegistry

  beforeEach(() => {
    // Arrange
    registry = new ComponentRegistry()
  })

  it('should register and resolve a component', () => {
    // Arrange
    const mockComponent = () => null

    // Act
    registry.register('test-component', mockComponent)
    const resolved = registry.resolve('test-component')

    // Assert
    expect(resolved).toBe(mockComponent)
  })

  it('should return undefined for unregistered component', () => {
    // Act
    const resolved = registry.resolve('non-existent')

    // Assert
    expect(resolved).toBeUndefined()
  })

  it('should check if component type exists', () => {
    // Arrange
    const mockComponent = () => null
    registry.register('test-component', mockComponent)

    // Act & Assert
    expect(registry.has('test-component')).toBe(true)
    expect(registry.has('non-existent')).toBe(false)
  })
})
