import { describe, expect, it, vi } from 'vitest'
import type { ILogger } from '@ancadeba/utils'
import type { IJsonConfiguration, Scene, Tile } from '@ancadeba/schemas'
import type { MapData } from '../../resourceData/types'
import { ResourceDataStorage } from '../../resourceData/storage'

describe('resourceData/storage', () => {
  const createMockLogger = (): ILogger => ({
    debug: vi.fn(() => ''),
    info: vi.fn(() => ''),
    warn: vi.fn(() => ''),
    error: vi.fn(() => ''),
    fatal: vi.fn(() => {
      throw new Error('fatal')
    }),
  })

  const createMockJsonConfiguration = (): IJsonConfiguration => ({
    rootPath: '/resources',
  })

  it('returns rootPath from jsonConfiguration', () => {
    // Arrange
    const logger = createMockLogger()
    const jsonConfiguration = createMockJsonConfiguration()
    jsonConfiguration.rootPath = '/game-data'
    const storage = new ResourceDataStorage(logger, jsonConfiguration)

    // Act
    const rootPath = storage.rootPath

    // Assert
    expect(rootPath).toBe('/game-data')
  })

  it('stores and retrieves scene data', () => {
    // Arrange
    const logger = createMockLogger()
    const jsonConfiguration = createMockJsonConfiguration()
    const storage = new ResourceDataStorage(logger, jsonConfiguration)
    const scene: Scene = {
      id: 'test-scene',
      sceneType: 'menu',
      components: [],
    }

    // Act
    storage.addSceneData('test-scene', scene)
    const retrievedScene = storage.getSceneData('test-scene')

    // Assert
    expect(retrievedScene).toBe(scene)
  })

  it('throws fatal error when retrieving non-existent scene', () => {
    // Arrange
    const logger = createMockLogger()
    const jsonConfiguration = createMockJsonConfiguration()
    const storage = new ResourceDataStorage(logger, jsonConfiguration)

    // Act & Assert
    expect(() => storage.getSceneData('non-existent')).toThrow('fatal')
    expect(logger.fatal).toHaveBeenCalledWith(
      'engine/resourceData/storage',
      'No scene data for id: {0}',
      'non-existent'
    )
  })

  it('stores and retrieves tile data', () => {
    // Arrange
    const logger = createMockLogger()
    const jsonConfiguration = createMockJsonConfiguration()
    const storage = new ResourceDataStorage(logger, jsonConfiguration)
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
    const jsonConfiguration = createMockJsonConfiguration()
    const storage = new ResourceDataStorage(logger, jsonConfiguration)

    // Act & Assert
    expect(() => storage.getTileData('non-existent')).toThrow('fatal')
    expect(logger.fatal).toHaveBeenCalledWith(
      'engine/resourceData/storage',
      'No tile data for id: {0}',
      'non-existent'
    )
  })

  it('stores and retrieves map data', () => {
    // Arrange
    const logger = createMockLogger()
    const jsonConfiguration = createMockJsonConfiguration()
    const storage = new ResourceDataStorage(logger, jsonConfiguration)
    const mapData: MapData = {
      id: 'test-map',
      width: 10,
      height: 10,
      tiles: new Map(),
      squares: [],
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
    const jsonConfiguration = createMockJsonConfiguration()
    const storage = new ResourceDataStorage(logger, jsonConfiguration)

    // Act & Assert
    expect(() => storage.getMapData('non-existent')).toThrow('fatal')
    expect(logger.fatal).toHaveBeenCalledWith(
      'engine/resourceData/storage',
      'No map data for id: {0}',
      'non-existent'
    )
  })

  it('stores and retrieves CSS file names', () => {
    // Arrange
    const logger = createMockLogger()
    const jsonConfiguration = createMockJsonConfiguration()
    const storage = new ResourceDataStorage(logger, jsonConfiguration)

    // Act
    storage.addCssFileName('game.css')
    storage.addCssFileName('theme.css')
    const cssFiles = storage.getCssFileNames()

    // Assert
    expect(cssFiles).toEqual(['game.css', 'theme.css'])
  })

  it('returns empty array when no CSS files added', () => {
    // Arrange
    const logger = createMockLogger()
    const jsonConfiguration = createMockJsonConfiguration()
    const storage = new ResourceDataStorage(logger, jsonConfiguration)

    // Act
    const cssFiles = storage.getCssFileNames()

    // Assert
    expect(cssFiles).toEqual([])
  })

  it('stores and retrieves language file names', () => {
    // Arrange
    const logger = createMockLogger()
    const jsonConfiguration = createMockJsonConfiguration()
    const storage = new ResourceDataStorage(logger, jsonConfiguration)

    // Act
    storage.setLanguageFileNames('en', ['system.json', 'tiles.json'])
    const languageFiles = storage.getLanguageFileNames('en')

    // Assert
    expect(languageFiles).toEqual(['system.json', 'tiles.json'])
  })

  it('throws fatal error when retrieving non-existent language', () => {
    // Arrange
    const logger = createMockLogger()
    const jsonConfiguration = createMockJsonConfiguration()
    const storage = new ResourceDataStorage(logger, jsonConfiguration)

    // Act & Assert
    expect(() => storage.getLanguageFileNames('non-existent')).toThrow('fatal')
    expect(logger.fatal).toHaveBeenCalledWith(
      'engine/resourceData/storage',
      'No language files for language: {0}',
      'non-existent'
    )
  })

  it('logs all loaded resource data', () => {
    // Arrange
    const logger = createMockLogger()
    const jsonConfiguration = createMockJsonConfiguration()
    const storage = new ResourceDataStorage(logger, jsonConfiguration)
    const scene: Scene = {
      id: 'scene-1',
      sceneType: 'menu',
      components: [],
    }
    const tile: Tile = {
      id: 'tile-1',
      walkable: true,
    }
    const mapData: MapData = {
      id: 'map-1',
      width: 5,
      height: 5,
      tiles: new Map(),
      squares: [],
    }
    storage.addSceneData('scene-1', scene)
    storage.addTileData('tile-1', tile)
    storage.addMapData('map-1', mapData)
    storage.addCssFileName('game.css')

    // Act
    storage.logResourceData()

    // Assert
    expect(logger.debug).toHaveBeenCalledWith(
      'engine/resourceData/storage',
      'Scenes loaded: {0}',
      ['scene-1']
    )
    expect(logger.debug).toHaveBeenCalledWith(
      'engine/resourceData/storage',
      'Tiles loaded: {0}',
      ['tile-1']
    )
    expect(logger.debug).toHaveBeenCalledWith(
      'engine/resourceData/storage',
      'Maps loaded: {0}',
      ['map-1']
    )
    expect(logger.debug).toHaveBeenCalledWith(
      'engine/resourceData/storage',
      'CSS files loaded: {0}',
      ['game.css']
    )
  })

  it('handles multiple scenes', () => {
    // Arrange
    const logger = createMockLogger()
    const jsonConfiguration = createMockJsonConfiguration()
    const storage = new ResourceDataStorage(logger, jsonConfiguration)
    const scene1: Scene = {
      id: 'scene-1',
      sceneType: 'menu',
      components: [],
    }
    const scene2: Scene = {
      id: 'scene-2',
      sceneType: 'game',
      components: [],
    }

    // Act
    storage.addSceneData('scene-1', scene1)
    storage.addSceneData('scene-2', scene2)

    // Assert
    expect(storage.getSceneData('scene-1')).toBe(scene1)
    expect(storage.getSceneData('scene-2')).toBe(scene2)
  })

  it('handles multiple tiles', () => {
    // Arrange
    const logger = createMockLogger()
    const jsonConfiguration = createMockJsonConfiguration()
    const storage = new ResourceDataStorage(logger, jsonConfiguration)
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

  it('handles multiple maps', () => {
    // Arrange
    const logger = createMockLogger()
    const jsonConfiguration = createMockJsonConfiguration()
    const storage = new ResourceDataStorage(logger, jsonConfiguration)
    const map1: MapData = {
      id: 'map-1',
      width: 5,
      height: 5,
      tiles: new Map(),
      squares: [],
    }
    const map2: MapData = {
      id: 'map-2',
      width: 10,
      height: 10,
      tiles: new Map(),
      squares: [],
    }

    // Act
    storage.addMapData('map-1', map1)
    storage.addMapData('map-2', map2)

    // Assert
    expect(storage.getMapData('map-1')).toBe(map1)
    expect(storage.getMapData('map-2')).toBe(map2)
  })

  it('handles multiple languages', () => {
    // Arrange
    const logger = createMockLogger()
    const jsonConfiguration = createMockJsonConfiguration()
    const storage = new ResourceDataStorage(logger, jsonConfiguration)

    // Act
    storage.setLanguageFileNames('en', ['system.json'])
    storage.setLanguageFileNames('fr', ['systeme.json'])

    // Assert
    expect(storage.getLanguageFileNames('en')).toEqual(['system.json'])
    expect(storage.getLanguageFileNames('fr')).toEqual(['systeme.json'])
  })
})
