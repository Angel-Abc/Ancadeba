import { describe, expect, it, vi } from 'vitest'
import type { Scene } from '@ancadeba/schemas'
import type {
  IResourceRootPath,
  ISceneDataStorage,
  ICssFileStorage,
  IMapDataStorage,
  ILanguageFileStorage,
} from '../../resourceData/storage'
import type { MapData } from '../../resourceData/types'
import { ResourceDataProvider } from '../../resourceData/provider'

describe('resourceData/provider', () => {
  const createMockResourceRootPath = (
    rootPath = '/resources'
  ): IResourceRootPath => ({
    rootPath,
  })

  const createMockSceneDataStorage = (): ISceneDataStorage => ({
    addSceneData: vi.fn(),
    getSceneData: vi.fn(),
  })

  const createMockCssFileStorage = (): ICssFileStorage => ({
    addCssFileName: vi.fn(),
    getCssFileNames: vi.fn(() => []),
  })

  const createMockMapDataStorage = (): IMapDataStorage => ({
    addMapData: vi.fn(),
    getMapData: vi.fn(),
  })

  const createMockLanguageFileStorage = (): ILanguageFileStorage => ({
    getLanguageFileNames: vi.fn(() => []),
    setLanguageFileNames: vi.fn(),
  })

  it('returns assetsUrl from storage rootPath', () => {
    // Arrange
    const resourceRootPath = createMockResourceRootPath('/game-resources')
    const sceneDataStorage = createMockSceneDataStorage()
    const cssFileStorage = createMockCssFileStorage()
    const mapDataStorage = createMockMapDataStorage()
    const languageFileStorage = createMockLanguageFileStorage()
    const provider = new ResourceDataProvider(
      resourceRootPath,
      sceneDataStorage,
      cssFileStorage,
      mapDataStorage,
      languageFileStorage
    )

    // Act
    const assetsUrl = provider.assetsUrl

    // Assert
    expect(assetsUrl).toBe('/game-resources/assets')
  })

  it('delegates getSceneData to storage', () => {
    // Arrange
    const resourceRootPath = createMockResourceRootPath()
    const sceneDataStorage = createMockSceneDataStorage()
    const cssFileStorage = createMockCssFileStorage()
    const mapDataStorage = createMockMapDataStorage()
    const languageFileStorage = createMockLanguageFileStorage()
    const mockScene: Scene = {
      id: 'test-scene',
      sceneType: 'menu',
      components: [],
    }
    vi.mocked(sceneDataStorage.getSceneData).mockReturnValue(mockScene)
    const provider = new ResourceDataProvider(
      resourceRootPath,
      sceneDataStorage,
      cssFileStorage,
      mapDataStorage,
      languageFileStorage
    )

    // Act
    const scene = provider.getSceneData('test-scene')

    // Assert
    expect(sceneDataStorage.getSceneData).toHaveBeenCalledWith('test-scene')
    expect(scene).toBe(mockScene)
  })

  it('maps CSS filenames to full URLs', () => {
    // Arrange
    const resourceRootPath = createMockResourceRootPath('/resources')
    const sceneDataStorage = createMockSceneDataStorage()
    const cssFileStorage = createMockCssFileStorage()
    const mapDataStorage = createMockMapDataStorage()
    const languageFileStorage = createMockLanguageFileStorage()
    vi.mocked(cssFileStorage.getCssFileNames).mockReturnValue([
      'game.css',
      'theme.css',
    ])
    const provider = new ResourceDataProvider(
      resourceRootPath,
      sceneDataStorage,
      cssFileStorage,
      mapDataStorage,
      languageFileStorage
    )

    // Act
    const cssPaths = provider.getCssFilePaths()

    // Assert
    expect(cssFileStorage.getCssFileNames).toHaveBeenCalled()
    expect(cssPaths).toEqual([
      '/resources/assets/css/game.css',
      '/resources/assets/css/theme.css',
    ])
  })

  it('returns empty array when no CSS files exist', () => {
    // Arrange
    const resourceRootPath = createMockResourceRootPath()
    const sceneDataStorage = createMockSceneDataStorage()
    const cssFileStorage = createMockCssFileStorage()
    const mapDataStorage = createMockMapDataStorage()
    const languageFileStorage = createMockLanguageFileStorage()
    vi.mocked(cssFileStorage.getCssFileNames).mockReturnValue([])
    const provider = new ResourceDataProvider(
      resourceRootPath,
      sceneDataStorage,
      cssFileStorage,
      mapDataStorage,
      languageFileStorage
    )

    // Act
    const cssPaths = provider.getCssFilePaths()

    // Assert
    expect(cssPaths).toEqual([])
  })

  it('delegates getMapData to storage', () => {
    // Arrange
    const resourceRootPath = createMockResourceRootPath()
    const sceneDataStorage = createMockSceneDataStorage()
    const cssFileStorage = createMockCssFileStorage()
    const mapDataStorage = createMockMapDataStorage()
    const languageFileStorage = createMockLanguageFileStorage()
    const mockMapData: MapData = {
      id: 'test-map',
      width: 10,
      height: 10,
      tiles: new Map(),
      squares: [],
    }
    vi.mocked(mapDataStorage.getMapData).mockReturnValue(mockMapData)
    const provider = new ResourceDataProvider(
      resourceRootPath,
      sceneDataStorage,
      cssFileStorage,
      mapDataStorage,
      languageFileStorage
    )

    // Act
    const mapData = provider.getMapData('test-map')

    // Assert
    expect(mapDataStorage.getMapData).toHaveBeenCalledWith('test-map')
    expect(mapData).toBe(mockMapData)
  })

  it('maps language filenames to full paths with language directory', () => {
    // Arrange
    const resourceRootPath = createMockResourceRootPath('/resources')
    const sceneDataStorage = createMockSceneDataStorage()
    const cssFileStorage = createMockCssFileStorage()
    const mapDataStorage = createMockMapDataStorage()
    const languageFileStorage = createMockLanguageFileStorage()
    vi.mocked(languageFileStorage.getLanguageFileNames).mockReturnValue([
      'en/system.json',
      'en/tiles.json',
    ])
    const provider = new ResourceDataProvider(
      resourceRootPath,
      sceneDataStorage,
      cssFileStorage,
      mapDataStorage,
      languageFileStorage
    )

    // Act
    const languagePaths = provider.getLanguageFilePaths('en')

    // Assert
    expect(languageFileStorage.getLanguageFileNames).toHaveBeenCalledWith('en')
    expect(languagePaths).toEqual([
      '/resources/languages/en/system.json',
      '/resources/languages/en/tiles.json',
    ])
  })

  it('returns empty array when no language files exist', () => {
    // Arrange
    const resourceRootPath = createMockResourceRootPath()
    const sceneDataStorage = createMockSceneDataStorage()
    const cssFileStorage = createMockCssFileStorage()
    const mapDataStorage = createMockMapDataStorage()
    const languageFileStorage = createMockLanguageFileStorage()
    vi.mocked(languageFileStorage.getLanguageFileNames).mockReturnValue([])
    const provider = new ResourceDataProvider(
      resourceRootPath,
      sceneDataStorage,
      cssFileStorage,
      mapDataStorage,
      languageFileStorage
    )

    // Act
    const languagePaths = provider.getLanguageFilePaths('fr')

    // Assert
    expect(languagePaths).toEqual([])
  })

  it('constructs correct assetsUrl with different rootPaths', () => {
    // Arrange
    const resourceRootPath1 = createMockResourceRootPath('/game')
    const sceneDataStorage1 = createMockSceneDataStorage()
    const cssFileStorage1 = createMockCssFileStorage()
    const mapDataStorage1 = createMockMapDataStorage()
    const languageFileStorage1 = createMockLanguageFileStorage()
    const provider1 = new ResourceDataProvider(
      resourceRootPath1,
      sceneDataStorage1,
      cssFileStorage1,
      mapDataStorage1,
      languageFileStorage1
    )

    const resourceRootPath2 = createMockResourceRootPath('/different-path')
    const sceneDataStorage2 = createMockSceneDataStorage()
    const cssFileStorage2 = createMockCssFileStorage()
    const mapDataStorage2 = createMockMapDataStorage()
    const languageFileStorage2 = createMockLanguageFileStorage()
    const resourceRootPath3 = createMockResourceRootPath('/data/resources')
    const sceneDataStorage3 = createMockSceneDataStorage()
    const cssFileStorage3 = createMockCssFileStorage()
    const mapDataStorage3 = createMockMapDataStorage()
    const languageFileStorage3 = createMockLanguageFileStorage()
    const provider2 = new ResourceDataProvider(
      resourceRootPath2,
      sceneDataStorage2,
      cssFileStorage2,
      mapDataStorage2,
      languageFileStorage2
    )
    const provider3 = new ResourceDataProvider(
      resourceRootPath3,
      sceneDataStorage3,
      cssFileStorage3,
      mapDataStorage3,
      languageFileStorage3
    )

    // Act & Assert
    expect(provider1.assetsUrl).toBe('/game/assets')
    expect(provider2.assetsUrl).toBe('/different-path/assets')
    expect(provider3.assetsUrl).toBe('/data/resources/assets')
  })
})
