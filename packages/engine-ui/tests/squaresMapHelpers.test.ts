import type { GameMap } from '@ancadeba/content'
import { describe, expect, it } from 'vitest'
import {
  buildViewportCells,
  calculateTrackedViewportOrigin,
  moveViewportOrigin,
} from '../src/visuals/widgets/squaresMapHelpers'

const map: GameMap = {
  id: 'test-map',
  width: 4,
  height: 3,
  tiles: [
    {
      key: 'g1',
      tile: 'outdoor.grass',
    },
    {
      key: 'o1',
      tile: 'outdoor.ocean',
    },
  ],
  map: ['g1,g1,g1,g1', 'g1,o1,o1,g1', 'g1,g1,g1,g1'],
}

describe('squares map helpers', () => {
  it('clamps tracked viewport origins near map edges', () => {
    // Arrange
    const playerPosition = {
      row: 2,
      column: 3,
    }

    // Act
    const origin = calculateTrackedViewportOrigin(
      playerPosition,
      { width: 3, height: 3 },
      map,
    )

    // Assert
    expect(origin).toEqual({
      row: 0,
      column: 1,
    })
  })

  it('clamps free movement at map edges', () => {
    // Arrange
    const origin = {
      row: 0,
      column: 1,
    }

    // Act
    const moved = moveViewportOrigin(
      origin,
      { row: 0, column: 10 },
      { width: 3, height: 3 },
      map,
    )

    // Assert
    expect(moved).toEqual({
      row: 0,
      column: 1,
    })
  })

  it('returns the requested number of viewport cells', () => {
    // Arrange
    const origin = {
      row: 0,
      column: 0,
    }

    // Act
    const cells = buildViewportCells(map, origin, { width: 5, height: 4 })

    // Assert
    expect(cells).toHaveLength(20)
  })

  it('marks cells outside the map as empty', () => {
    // Arrange
    const origin = {
      row: 0,
      column: 0,
    }

    // Act
    const cells = buildViewportCells(map, origin, { width: 5, height: 4 })

    // Assert
    expect(cells[cells.length - 1]).toEqual({
      row: 3,
      column: 4,
      tileKey: null,
      tileReference: null,
    })
  })
})
