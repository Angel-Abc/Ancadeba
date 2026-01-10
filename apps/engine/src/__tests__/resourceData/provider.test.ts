import { describe, expect, it, vi } from 'vitest'
import type { Scene } from '@ancadeba/schemas'
import type { IResourceDataStorage } from '../../resourceData/storage'
import type { MapData } from '../../resourceData/types'
import { ResourceDataProvider } from '../../resourceData/provider'

describe('resourceData/provider', () => {
  const createMockResourceDataStorage = (): IResourceDataStorage => ({
    rootPath: '/resources',
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

  it('returns assetsUrl from storage rootPath', () => {
    // Arrange
    const storage = createMockResourceDataStorage()
    storage.rootPath = '/game-resources'
    const provider = new ResourceDataProvider(storage)

    // Act
    const assetsUrl = provider.assetsUrl

    // Assert
    expect(assetsUrl).toBe('/game-resources/assets')
  })

  it('delegates getSceneData to storage', () => {
    // Arrange
    const storage = createMockResourceDataStorage()
    const mockScene: Scene = {
      id: 'test-scene',
      sceneType: 'menu',
      components: [],
    }
    vi.mocked(storage.getSceneData).mockReturnValue(mockScene)
    const provider = new ResourceDataProvider(storage)

    // Act
    const scene = provider.getSceneData('test-scene')

    // Assert
    expect(storage.getSceneData).toHaveBeenCalledWith('test-scene')
    expect(scene).toBe(mockScene)
  })

  it('maps CSS filenames to full URLs', () => {
    // Arrange
    const storage = createMockResourceDataStorage()
    storage.rootPath = '/resources'
    vi.mocked(storage.getCssFileNames).mockReturnValue([
      'game.css',
      'theme.css',
    ])
    const provider = new ResourceDataProvider(storage)

    // Act
    const cssPaths = provider.getCssFilePaths()

    // Assert
    expect(storage.getCssFileNames).toHaveBeenCalled()
    expect(cssPaths).toEqual([
      '/resources/assets/css/game.css',
      '/resources/assets/css/theme.css',
    ])
  })

  it('returns empty array when no CSS files exist', () => {
    // Arrange
    const storage = createMockResourceDataStorage()
    vi.mocked(storage.getCssFileNames).mockReturnValue([])
    const provider = new ResourceDataProvider(storage)

    // Act
    const cssPaths = provider.getCssFilePaths()

    // Assert
    expect(cssPaths).toEqual([])
  })

  it('delegates getMapData to storage', () => {
    // Arrange
    const storage = createMockResourceDataStorage()
    const mockMapData: MapData = {
      id: 'test-map',
      width: 10,
      height: 10,
      tiles: new Map(),
      squares: [],
    }
    vi.mocked(storage.getMapData).mockReturnValue(mockMapData)
    const provider = new ResourceDataProvider(storage)

    // Act
    const mapData = provider.getMapData('test-map')

    // Assert
    expect(storage.getMapData).toHaveBeenCalledWith('test-map')
    expect(mapData).toBe(mockMapData)
  })

  it('maps language filenames to full paths with language directory', () => {
    // Arrange
    const storage = createMockResourceDataStorage()
    storage.rootPath = '/resources'
    vi.mocked(storage.getLanguageFileNames).mockReturnValue([
      'en/system.json',
      'en/tiles.json',
    ])
    const provider = new ResourceDataProvider(storage)

    // Act
    const languagePaths = provider.getLanguageFilePaths('en')

    // Assert
    expect(storage.getLanguageFileNames).toHaveBeenCalledWith('en')
    expect(languagePaths).toEqual([
      '/resources/languages/en/system.json',
      '/resources/languages/en/tiles.json',
    ])
  })

  it('returns empty array when no language files exist', () => {
    // Arrange
    const storage = createMockResourceDataStorage()
    vi.mocked(storage.getLanguageFileNames).mockReturnValue([])
    const provider = new ResourceDataProvider(storage)

    // Act
    const languagePaths = provider.getLanguageFilePaths('fr')

    // Assert
    expect(languagePaths).toEqual([])
  })

  it('constructs correct assetsUrl with different rootPaths', () => {
    // Arrange
    const storage1 = createMockResourceDataStorage()
    storage1.rootPath = '/game'
    const provider1 = new ResourceDataProvider(storage1)

    const storage2 = createMockResourceDataStorage()
    storage2.rootPath = '/data/resources'
    const provider2 = new ResourceDataProvider(storage2)

    // Act & Assert
    expect(provider1.assetsUrl).toBe('/game/assets')
    expect(provider2.assetsUrl).toBe('/data/resources/assets')
  })
})
