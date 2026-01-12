import { describe, expect, it, vi } from 'vitest'
import type { ILogger } from '@ancadeba/utils'
import type { MapData } from '../../resourceData/types'
import { MapDataStorage } from '../../resourceData/mapDataStorage'

describe('resourceData/MapDataStorage', () => {
  const createMockLogger = (): ILogger => ({
    debug: vi.fn(() => ''),
    info: vi.fn(() => ''),
    warn: vi.fn(() => ''),
    error: vi.fn(() => ''),
    fatal: vi.fn(() => {
      throw new Error('fatal')
    }),
  })

  it('stores and retrieves map data', () => {
    // Arrange
    const logger = createMockLogger()
    const storage = new MapDataStorage(logger)
    const mapData: MapData = {
      id: 'test-map',
      width: 10,
      height: 10,
      tileIds: [],
      walkableGrid: [],
    }

    // Act
    storage.addMapData('test-map', mapData)
    const retrievedMap = storage.getMapData('test-map')

    // Assert
    expect(retrievedMap).toBe(mapData)
  })

  it('throws fatal error when retrieving non-existent map', () => {
    // Arrange
    const logger = createMockLogger()
    const storage = new MapDataStorage(logger)

    // Act & Assert
    expect(() => storage.getMapData('non-existent')).toThrow('fatal')
    expect(logger.fatal).toHaveBeenCalledWith(
      'engine/resourceData/MapDataStorage',
      'No map data for id: {0}',
      'non-existent'
    )
  })

  it('handles multiple maps', () => {
    // Arrange
    const logger = createMockLogger()
    const storage = new MapDataStorage(logger)
    const map1: MapData = {
      id: 'map-1',
      width: 5,
      height: 5,
      tileIds: [],
      walkableGrid: [],
    }
    const map2: MapData = {
      id: 'map-2',
      width: 10,
      height: 10,
      tileIds: [],
      walkableGrid: [],
    }

    // Act
    storage.addMapData('map-1', map1)
    storage.addMapData('map-2', map2)

    // Assert
    expect(storage.getMapData('map-1')).toBe(map1)
    expect(storage.getMapData('map-2')).toBe(map2)
  })
})
