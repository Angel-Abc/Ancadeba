import { describe, expect, it } from 'vitest'
import { describeToken, token } from '../../ioc/token'

describe('ioc/token', () => {
  it('returns token descriptions when provided', () => {
    // Arrange
    const value = token('test/description')

    // Act
    const description = describeToken(value)

    // Assert
    expect(description).toBe('test/description')
  })

  it('falls back to anonymous-token when missing a description', () => {
    // Arrange
    const value = token()

    // Act
    const description = describeToken(value)

    // Assert
    expect(description).toBe('anonymous-token')
  })
})
