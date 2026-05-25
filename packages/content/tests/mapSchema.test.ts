import { describe, expect, it } from 'vitest'
import { mapSchema } from '../src/schemas/map'

function createValidMap(): Record<string, unknown> {
  return {
    id: 'start-beach',
    width: 2,
    height: 2,
    tiles: [
      {
        key: 'o1',
        tile: 'outdoor.ocean',
      },
      {
        key: 'g1',
        tile: 'outdoor.grass',
      },
    ],
    map: ['o1,o1', 'g1,g1'],
  }
}

describe('map schema', () => {
  it('accepts valid maps', () => {
    // Arrange
    const map = createValidMap()

    // Act
    const result = mapSchema.safeParse(map)

    // Assert
    expect(result.success).toBe(true)
  })

  it('rejects row counts that do not match height', () => {
    // Arrange
    const map = {
      ...createValidMap(),
      height: 3,
    }

    // Act
    const result = mapSchema.safeParse(map)

    // Assert
    expect(result.success).toBe(false)
  })

  it('rejects row widths that do not match width', () => {
    // Arrange
    const map = {
      ...createValidMap(),
      map: ['o1,o1,o1', 'g1,g1'],
    }

    // Act
    const result = mapSchema.safeParse(map)

    // Assert
    expect(result.success).toBe(false)
  })

  it('rejects undeclared tile keys', () => {
    // Arrange
    const map = {
      ...createValidMap(),
      map: ['o1,o1', 'g1,b1'],
    }

    // Act
    const result = mapSchema.safeParse(map)

    // Assert
    expect(result.success).toBe(false)
  })

  it('rejects duplicate tile keys', () => {
    // Arrange
    const map = {
      ...createValidMap(),
      tiles: [
        {
          key: 'o1',
          tile: 'outdoor.ocean',
        },
        {
          key: 'o1',
          tile: 'outdoor.grass',
        },
      ],
    }

    // Act
    const result = mapSchema.safeParse(map)

    // Assert
    expect(result.success).toBe(false)
  })

  it('rejects malformed tile references', () => {
    // Arrange
    const map = {
      ...createValidMap(),
      tiles: [
        {
          key: 'o1',
          tile: 'ocean',
        },
        {
          key: 'g1',
          tile: 'outdoor.grass',
        },
      ],
    }

    // Act
    const result = mapSchema.safeParse(map)

    // Assert
    expect(result.success).toBe(false)
  })
})
