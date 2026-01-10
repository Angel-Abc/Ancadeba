import { describe, expect, it, vi } from 'vitest'
import type { TileSet, Tile } from '@ancadeba/schemas'
import type { IResourceDataStorage } from '../../../resourceData/storage'
import { TileDataInitializer } from '../../../core/initializers/tileDataInitializer'

describe('core/initializers/tileDataInitializer', () => {
  const createMockResourceDataStorage = (): IResourceDataStorage => ({
    get rootPath() {
      return '/resources'
    },
    logResourceData: vi.fn(),
    addSceneData: vi.fn(),
    getSceneData: vi.fn(),
    addTileData: vi.fn(),
    getTileData: vi.fn(),
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
    const initializer = new TileDataInitializer(storage)

    // Act
    initializer.initializeTiles([])

    // Assert
    expect(storage.addTileData).not.toHaveBeenCalled()
  })

  it('adds single tile with correct composite ID', () => {
    // Arrange
    const storage = createMockResourceDataStorage()
    const initializer = new TileDataInitializer(storage)
    const tile: Tile = {
      id: 'grass',
      walkable: true,
    }
    const tileSet: TileSet = {
      id: 'outdoor',
      tiles: [tile],
    }

    // Act
    initializer.initializeTiles([tileSet])

    // Assert
    expect(storage.addTileData).toHaveBeenCalledTimes(1)
    expect(storage.addTileData).toHaveBeenCalledWith('outdoor.grass', tile)
  })

  it('adds multiple tiles from single tileset', () => {
    // Arrange
    const storage = createMockResourceDataStorage()
    const initializer = new TileDataInitializer(storage)
    const tile1: Tile = {
      id: 'grass',
      walkable: true,
    }
    const tile2: Tile = {
      id: 'water',
      walkable: false,
    }
    const tile3: Tile = {
      id: 'stone',
      walkable: true,
    }
    const tileSet: TileSet = {
      id: 'outdoor',
      tiles: [tile1, tile2, tile3],
    }

    // Act
    initializer.initializeTiles([tileSet])

    // Assert
    expect(storage.addTileData).toHaveBeenCalledTimes(3)
    expect(storage.addTileData).toHaveBeenNthCalledWith(
      1,
      'outdoor.grass',
      tile1
    )
    expect(storage.addTileData).toHaveBeenNthCalledWith(
      2,
      'outdoor.water',
      tile2
    )
    expect(storage.addTileData).toHaveBeenNthCalledWith(
      3,
      'outdoor.stone',
      tile3
    )
  })

  it('processes multiple tilesets', () => {
    // Arrange
    const storage = createMockResourceDataStorage()
    const initializer = new TileDataInitializer(storage)
    const outdoorTile: Tile = {
      id: 'grass',
      walkable: true,
    }
    const indoorTile: Tile = {
      id: 'floor',
      walkable: true,
    }
    const outdoorTileSet: TileSet = {
      id: 'outdoor',
      tiles: [outdoorTile],
    }
    const indoorTileSet: TileSet = {
      id: 'indoor',
      tiles: [indoorTile],
    }

    // Act
    initializer.initializeTiles([outdoorTileSet, indoorTileSet])

    // Assert
    expect(storage.addTileData).toHaveBeenCalledTimes(2)
    expect(storage.addTileData).toHaveBeenNthCalledWith(
      1,
      'outdoor.grass',
      outdoorTile
    )
    expect(storage.addTileData).toHaveBeenNthCalledWith(
      2,
      'indoor.floor',
      indoorTile
    )
  })

  it('generates correct composite tile IDs for each tile', () => {
    // Arrange
    const storage = createMockResourceDataStorage()
    const initializer = new TileDataInitializer(storage)
    const tile1: Tile = {
      id: 'tile-1',
      walkable: true,
    }
    const tile2: Tile = {
      id: 'tile-2',
      walkable: false,
    }
    const tileSet1: TileSet = {
      id: 'set-a',
      tiles: [tile1],
    }
    const tileSet2: TileSet = {
      id: 'set-b',
      tiles: [tile2],
    }

    // Act
    initializer.initializeTiles([tileSet1, tileSet2])

    // Assert
    expect(storage.addTileData).toHaveBeenCalledWith('set-a.tile-1', tile1)
    expect(storage.addTileData).toHaveBeenCalledWith('set-b.tile-2', tile2)
  })

  it('handles tileset with no tiles', () => {
    // Arrange
    const storage = createMockResourceDataStorage()
    const initializer = new TileDataInitializer(storage)
    const emptyTileSet: TileSet = {
      id: 'empty',
      tiles: [],
    }

    // Act
    initializer.initializeTiles([emptyTileSet])

    // Assert
    expect(storage.addTileData).not.toHaveBeenCalled()
  })

  it('processes mixed tilesets with varying tile counts', () => {
    // Arrange
    const storage = createMockResourceDataStorage()
    const initializer = new TileDataInitializer(storage)
    const tile1: Tile = { id: 'tile1', walkable: true }
    const tile2: Tile = { id: 'tile2', walkable: false }
    const tile3: Tile = { id: 'tile3', walkable: true }
    const tileSet1: TileSet = {
      id: 'set1',
      tiles: [tile1, tile2],
    }
    const tileSet2: TileSet = {
      id: 'set2',
      tiles: [],
    }
    const tileSet3: TileSet = {
      id: 'set3',
      tiles: [tile3],
    }

    // Act
    initializer.initializeTiles([tileSet1, tileSet2, tileSet3])

    // Assert
    expect(storage.addTileData).toHaveBeenCalledTimes(3)
    expect(storage.addTileData).toHaveBeenNthCalledWith(1, 'set1.tile1', tile1)
    expect(storage.addTileData).toHaveBeenNthCalledWith(2, 'set1.tile2', tile2)
    expect(storage.addTileData).toHaveBeenNthCalledWith(3, 'set3.tile3', tile3)
  })
})
