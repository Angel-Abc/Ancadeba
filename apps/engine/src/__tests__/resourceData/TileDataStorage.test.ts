import { describe, expect, it, vi } from 'vitest'
import type { ILogger } from '@ancadeba/utils'
import type { Tile } from '@ancadeba/schemas'
import { TileDataStorage } from '../../resourceData/tileDataStorage'

describe('resourceData/TileDataStorage', () => {
  const createMockLogger = (): ILogger => ({
    debug: vi.fn(() => ''),
    info: vi.fn(() => ''),
    warn: vi.fn(() => ''),
    error: vi.fn(() => ''),
    fatal: vi.fn(() => {
      throw new Error('fatal')
    }),
  })

  it('stores and retrieves tile data', () => {
    // Arrange
    const logger = createMockLogger()
    const storage = new TileDataStorage(logger)
    const tile: Tile = {
      id: 'test-tile',
      walkable: true,
    }

    // Act
    storage.addTileData('test-tile', tile)
    const retrievedTile = storage.getTileData('test-tile')

    // Assert
    expect(retrievedTile).toBe(tile)
  })

  it('throws fatal error when retrieving non-existent tile', () => {
    // Arrange
    const logger = createMockLogger()
    const storage = new TileDataStorage(logger)

    // Act & Assert
    expect(() => storage.getTileData('non-existent')).toThrow('fatal')
    expect(logger.fatal).toHaveBeenCalledWith(
      'engine/resourceData/TileDataStorage',
      'No tile data for id: {0}',
      'non-existent'
    )
  })

  it('handles multiple tiles', () => {
    // Arrange
    const logger = createMockLogger()
    const storage = new TileDataStorage(logger)
    const tile1: Tile = {
      id: 'tile-1',
      walkable: true,
    }
    const tile2: Tile = {
      id: 'tile-2',
      walkable: false,
    }

    // Act
    storage.addTileData('tile-1', tile1)
    storage.addTileData('tile-2', tile2)

    // Assert
    expect(storage.getTileData('tile-1')).toBe(tile1)
    expect(storage.getTileData('tile-2')).toBe(tile2)
  })
})
