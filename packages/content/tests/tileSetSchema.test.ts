import { describe, expect, it } from 'vitest'
import { tileSetSchema } from '../src/schemas/tileSet'

describe('tile set schema', () => {
  it('accepts valid tile sets', () => {
    // Arrange
    const tileSet = {
      id: 'outdoor',
      tiles: [
        {
          id: 'grass',
          description: 'tile.outdoor.grass',
          color: 'lightgreen',
          walkable: true,
        },
        {
          id: 'ocean',
          description: 'tile.outdoor.ocean',
          image: 'images/outdoor/waves.svg',
          color: 'aqua',
          walkable: false,
        },
      ],
    }

    // Act
    const result = tileSetSchema.safeParse(tileSet)

    // Assert
    expect(result.success).toBe(true)
  })

  it('rejects duplicate tile IDs', () => {
    // Arrange
    const tileSet = {
      id: 'outdoor',
      tiles: [
        {
          id: 'grass',
          description: 'tile.outdoor.grass',
          color: 'lightgreen',
          walkable: true,
        },
        {
          id: 'grass',
          description: 'tile.outdoor.alt-grass',
          color: 'green',
          walkable: true,
        },
      ],
    }

    // Act
    const result = tileSetSchema.safeParse(tileSet)

    // Assert
    expect(result.success).toBe(false)
  })
})
