import { describe, it, expect } from 'vitest'

describe('engine-ui package', () => {
  it('runs a basic assertion', () => {
    // Arrange
    const value = 1

    // Act
    const result = value + 1

    // Assert
    expect(result).toBe(2)
  })
})
