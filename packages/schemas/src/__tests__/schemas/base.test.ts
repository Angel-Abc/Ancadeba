import { describe, expect, it } from 'vitest'
import { BaseSchema } from '../../schemas/base'

describe('BaseSchema', () => {
  it('accepts a valid base object', () => {
    // Arrange
    const validBase = {
      id: 'base-1',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    }

    // Act
    const result = BaseSchema.safeParse(validBase)

    // Assert
    expect(result.success).toBe(true)
  })

  it('rejects an invalid id type', () => {
    // Arrange
    const invalidBase = {
      id: 12345, // Invalid type
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    }

    // Act
    const result = BaseSchema.safeParse(invalidBase)

    // Assert
    expect(result.success).toBe(false)
  })

  it('rejects missing required fields', () => {
    // Arrange
    const invalidBase = {
      // id is missing
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    }

    // Act
    const result = BaseSchema.safeParse(invalidBase)

    // Assert
    expect(result.success).toBe(false)
  })

  it('rejects invalid datetime format', () => {
    // Arrange
    const invalidBase = {
      id: 'base-1',
      createdAt: 'invalid-datetime', // Invalid format
      updatedAt: '2025-01-01T00:00:00Z',
    }

    // Act
    const result = BaseSchema.safeParse(invalidBase)

    // Assert
    expect(result.success).toBe(false)
  })
})
