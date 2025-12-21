import { describe, it, expect } from 'vitest'
import { LevelSchema } from '../index'

describe('LevelSchema', () => {
  it('accepts a valid level', () => {
    // Arrange
    const validLevel = {
      id: 'level-1',
      name: 'Tutorial',
      type: 'level',
      difficulty: 1,
      mapFile: 'tutorial.map',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    }

    // Act
    const result = LevelSchema.safeParse(validLevel)

    // Assert
    expect(result.success).toBe(true)
  })

  it('rejects a level with an invalid difficulty', () => {
    // Arrange
    const invalidLevel = {
      id: 'level-1',
      name: 'Tutorial',
      type: 'level',
      difficulty: 99, // invalid
      mapFile: 'tutorial.map',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    }

    // Act
    const result = LevelSchema.safeParse(invalidLevel)

    // Assert
    expect(result.success).toBe(false)
  })
})
