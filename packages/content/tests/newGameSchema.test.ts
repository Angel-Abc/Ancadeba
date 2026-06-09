import { describe, expect, it } from 'vitest'
import { newGameSchema } from '../src/schemas/newGame'

function createValidNewGame(): Record<string, unknown> {
  return {
    id: 'default',
    startSurfaceId: 'game',
    mapId: 'start-beach',
    player: {
      position: {
        row: 19,
        column: 2,
      },
    },
  }
}

describe('new game schema', () => {
  it('accepts valid new-game definitions', () => {
    // Arrange
    const newGame = createValidNewGame()

    // Act
    const result = newGameSchema.safeParse(newGame)

    // Assert
    expect(result.success).toBe(true)
  })

  it('rejects missing player positions', () => {
    // Arrange
    const newGame = {
      ...createValidNewGame(),
      player: {},
    }

    // Act
    const result = newGameSchema.safeParse(newGame)

    // Assert
    expect(result.success).toBe(false)
  })

  it('rejects negative player positions', () => {
    // Arrange
    const newGame = {
      ...createValidNewGame(),
      player: {
        position: {
          row: -1,
          column: 2,
        },
      },
    }

    // Act
    const result = newGameSchema.safeParse(newGame)

    // Assert
    expect(result.success).toBe(false)
  })
})
