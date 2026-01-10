import { describe, expect, it, vi } from 'vitest'
import type { Map as MapData, Tile } from '@ancadeba/schemas'
import type { IResourceDataStorage } from '../../../resourceData/storage'
import { MapDataInitializer } from '../../../core/initializers/mapDataInitializer'

describe('core/initializers/mapDataInitializer', () => {
  const createMockTile = (id: string): Tile => ({
    id,
    image: `${id}.png`,
    isObstacle: false,
  })

  const createMockResourceDataStorage = (): IResourceDataStorage => ({
    get rootPath() {
      return '/resources'
    },
    logResourceData: vi.fn(),
    addSceneData: vi.fn(),
    getSceneData: vi.fn(),
    addTileData: vi.fn(),
    getTileData: vi.fn((tileId: string) => createMockTile(tileId)),
    addCssFileName: vi.fn(),
    getCssFileNames: vi.fn(() => []),
    addMapData: vi.fn(),
    getMapData: vi.fn(),
    getLanguageFileNames: vi.fn(() => []),
    setLanguageFileNames: vi.fn(),
  })

  it('processes empty array without errors', () => {
    // Arrange
    const storage = createMockResourceDataStorage()
    const initializer = new MapDataInitializer(storage)

    // Act
    initializer.initializeMaps([])

    // Assert
    expect(storage.addMapData).not.toHaveBeenCalled()
  })

  it('adds single map with correct ID and dimensions', () => {
    // Arrange
    const storage = createMockResourceDataStorage()
    const initializer = new MapDataInitializer(storage)
    const mapData: MapData = {
      id: 'test-map',
      width: 3,
      height: 2,
      tiles: [{ key: 'g', tile: 'outdoor.grass' }],
      map: ['g,g,g', 'g,g,g'],
    }

    // Act
    initializer.initializeMaps([mapData])

    // Assert
    expect(storage.addMapData).toHaveBeenCalledTimes(1)
    const [id, transformedMap] = vi.mocked(storage.addMapData).mock.calls[0]
    expect(id).toBe('test-map')
    expect(transformedMap.id).toBe('test-map')
    expect(transformedMap.width).toBe(3)
    expect(transformedMap.height).toBe(2)
  })

  it('processes multiple maps', () => {
    // Arrange
    const storage = createMockResourceDataStorage()
    const initializer = new MapDataInitializer(storage)
    const map1: MapData = {
      id: 'map-1',
      width: 2,
      height: 2,
      tiles: [{ key: 'g', tile: 'outdoor.grass' }],
      map: ['g,g', 'g,g'],
    }
    const map2: MapData = {
      id: 'map-2',
      width: 3,
      height: 1,
      tiles: [{ key: 's', tile: 'outdoor.sand' }],
      map: ['s,s,s'],
    }
    const map3: MapData = {
      id: 'map-3',
      width: 1,
      height: 3,
      tiles: [{ key: 'w', tile: 'outdoor.water' }],
      map: ['w', 'w', 'w'],
    }

    // Act
    initializer.initializeMaps([map1, map2, map3])

    // Assert
    expect(storage.addMapData).toHaveBeenCalledTimes(3)
    expect(vi.mocked(storage.addMapData).mock.calls[0][0]).toBe('map-1')
    expect(vi.mocked(storage.addMapData).mock.calls[1][0]).toBe('map-2')
    expect(vi.mocked(storage.addMapData).mock.calls[2][0]).toBe('map-3')
  })

  it('transforms tiles into Map structure with getTileData lookups', () => {
    // Arrange
    const storage = createMockResourceDataStorage()
    const initializer = new MapDataInitializer(storage)
    const mapData: MapData = {
      id: 'test-map',
      width: 2,
      height: 1,
      tiles: [
        { key: 'g', tile: 'outdoor.grass' },
        { key: 's', tile: 'outdoor.sand' },
      ],
      map: ['g,s'],
    }

    // Act
    initializer.initializeMaps([mapData])

    // Assert
    expect(storage.getTileData).toHaveBeenCalledTimes(2)
    expect(storage.getTileData).toHaveBeenCalledWith('outdoor.grass')
    expect(storage.getTileData).toHaveBeenCalledWith('outdoor.sand')
    const [, transformedMap] = vi.mocked(storage.addMapData).mock.calls[0]
    expect(transformedMap.tiles).toBeInstanceOf(Map)
    expect(transformedMap.tiles.size).toBe(2)
    expect(transformedMap.tiles.get('g')).toEqual(
      createMockTile('outdoor.grass')
    )
    expect(transformedMap.tiles.get('s')).toEqual(
      createMockTile('outdoor.sand')
    )
  })

  it('parses squares from CSV strings correctly', () => {
    // Arrange
    const storage = createMockResourceDataStorage()
    const initializer = new MapDataInitializer(storage)
    const mapData: MapData = {
      id: 'test-map',
      width: 3,
      height: 2,
      tiles: [{ key: 'g', tile: 'outdoor.grass' }],
      map: ['g,g,g', 'g,g,g'],
    }

    // Act
    initializer.initializeMaps([mapData])

    // Assert
    const [, transformedMap] = vi.mocked(storage.addMapData).mock.calls[0]
    expect(transformedMap.squares).toEqual([
      ['g', 'g', 'g'],
      ['g', 'g', 'g'],
    ])
  })

  it('handles map with multiple tile references', () => {
    // Arrange
    const storage = createMockResourceDataStorage()
    const initializer = new MapDataInitializer(storage)
    const mapData: MapData = {
      id: 'complex-map',
      width: 4,
      height: 3,
      tiles: [
        { key: 'g', tile: 'outdoor.grass' },
        { key: 's', tile: 'outdoor.sand' },
        { key: 'w', tile: 'outdoor.water' },
        { key: 'r', tile: 'outdoor.rock' },
      ],
      map: ['g,g,s,s', 'g,w,w,s', 'r,r,r,r'],
    }

    // Act
    initializer.initializeMaps([mapData])

    // Assert
    expect(storage.getTileData).toHaveBeenCalledTimes(4)
    expect(storage.getTileData).toHaveBeenCalledWith('outdoor.grass')
    expect(storage.getTileData).toHaveBeenCalledWith('outdoor.sand')
    expect(storage.getTileData).toHaveBeenCalledWith('outdoor.water')
    expect(storage.getTileData).toHaveBeenCalledWith('outdoor.rock')
    const [, transformedMap] = vi.mocked(storage.addMapData).mock.calls[0]
    expect(transformedMap.tiles.size).toBe(4)
    expect(transformedMap.squares).toEqual([
      ['g', 'g', 's', 's'],
      ['g', 'w', 'w', 's'],
      ['r', 'r', 'r', 'r'],
    ])
  })

  it('integrates all map properties correctly', () => {
    // Arrange
    const storage = createMockResourceDataStorage()
    const initializer = new MapDataInitializer(storage)
    const mapData: MapData = {
      id: 'integration-map',
      width: 2,
      height: 2,
      tiles: [
        { key: 'a', tile: 'tileset.tile-a' },
        { key: 'b', tile: 'tileset.tile-b' },
      ],
      map: ['a,b', 'b,a'],
    }

    // Act
    initializer.initializeMaps([mapData])

    // Assert
    const [id, transformedMap] = vi.mocked(storage.addMapData).mock.calls[0]
    expect(id).toBe('integration-map')
    expect(transformedMap).toEqual({
      id: 'integration-map',
      width: 2,
      height: 2,
      tiles: new Map([
        ['a', createMockTile('tileset.tile-a')],
        ['b', createMockTile('tileset.tile-b')],
      ]),
      squares: [
        ['a', 'b'],
        ['b', 'a'],
      ],
    })
  })

  it('preserves tile data references from storage', () => {
    // Arrange
    const storage = createMockResourceDataStorage()
    const customTile: Tile = {
      id: 'custom.tile',
      image: 'custom-tile.png',
      isObstacle: true,
    }
    vi.mocked(storage.getTileData).mockReturnValue(customTile)
    const initializer = new MapDataInitializer(storage)
    const mapData: MapData = {
      id: 'ref-map',
      width: 1,
      height: 1,
      tiles: [{ key: 'c', tile: 'custom.tile' }],
      map: ['c'],
    }

    // Act
    initializer.initializeMaps([mapData])

    // Assert
    const [, transformedMap] = vi.mocked(storage.addMapData).mock.calls[0]
    expect(transformedMap.tiles.get('c')).toBe(customTile)
    expect(transformedMap.tiles.get('c')?.isObstacle).toBe(true)
  })
})
