import { describe, expect, it, vi } from 'vitest'
import type { Scene } from '@ancadeba/schemas'
import type {
  IResourceRootPath,
  ISceneDataStorage,
  ICssFileStorage,
  IMapDataStorage,
  IItemDataStorage,
  IComponentDefinitionStorage,
  IAppearanceCategoryStorage,
  IAppearanceDataStorage,
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
    getLoadedSceneIds: vi.fn(() => []),
  })

  const createMockCssFileStorage = (): ICssFileStorage => ({
    addCssFileName: vi.fn(),
    getCssFileNames: vi.fn(() => []),
  })

  const createMockMapDataStorage = (): IMapDataStorage => ({
    addMapData: vi.fn(),
    getMapData: vi.fn(),
    getLoadedMapIds: vi.fn(() => []),
  })

  const createMockItemDataStorage = (): IItemDataStorage => ({
    addItemData: vi.fn(),
    getItemData: vi.fn(),
    getLoadedItemIds: vi.fn(),
  })

  const createMockComponentDefinitionStorage =
    (): IComponentDefinitionStorage => ({
      addComponentDefinition: vi.fn(),
      getComponentDefinition: vi.fn(),
      hasComponentDefinition: vi.fn(),
      getLoadedDefinitionIds: vi.fn(() => []),
    })

  const createMockAppearanceCategoryStorage =
    (): IAppearanceCategoryStorage => ({
      addAppearanceCategoryData: vi.fn(),
      getAppearanceCategoryData: vi.fn(),
      getAllAppearanceCategories: vi.fn(() => []),
    })

  const createMockAppearanceDataStorage = (): IAppearanceDataStorage => ({
    addAppearanceData: vi.fn(),
    getAppearanceData: vi.fn(),
    getAppearancesByCategory: vi.fn(() => []),
  })

  const createMockLanguageFileStorage = (): ILanguageFileStorage => ({
    getLanguageFileNames: vi.fn(() => []),
    setLanguageFileNames: vi.fn(),
  })

  const createProvider = (rootPath = '/resources') => {
    const resourceRootPath = createMockResourceRootPath(rootPath)
    const sceneDataStorage = createMockSceneDataStorage()
    const cssFileStorage = createMockCssFileStorage()
    const mapDataStorage = createMockMapDataStorage()
    const itemDataStorage = createMockItemDataStorage()
    const componentDefinitionStorage = createMockComponentDefinitionStorage()
    const appearanceCategoryStorage = createMockAppearanceCategoryStorage()
    const appearanceDataStorage = createMockAppearanceDataStorage()
    const languageFileStorage = createMockLanguageFileStorage()

    return {
      provider: new ResourceDataProvider(
        resourceRootPath,
        sceneDataStorage,
        cssFileStorage,
        mapDataStorage,
        itemDataStorage,
        componentDefinitionStorage,
        appearanceCategoryStorage,
        appearanceDataStorage,
        languageFileStorage
      ),
      resourceRootPath,
      sceneDataStorage,
      cssFileStorage,
      mapDataStorage,
      itemDataStorage,
      componentDefinitionStorage,
      appearanceCategoryStorage,
      appearanceDataStorage,
      languageFileStorage,
    }
  }

  it('returns assetsUrl from storage rootPath', () => {
    // Arrange
    const { provider } = createProvider('/game-resources')

    // Act
    const assetsUrl = provider.assetsUrl

    // Assert
    expect(assetsUrl).toBe('/game-resources/assets')
  })

  it('delegates getSceneData to storage', () => {
    // Arrange
    const { provider, sceneDataStorage } = createProvider()
    const mockScene: Scene = {
      id: 'test-scene',
      createdAt: '2026-01-10T00:00:00Z',
      updatedAt: '2026-01-10T00:00:00Z',
      screen: { type: 'grid', grid: { rows: 1, columns: 1 } },
      components: [],
    }
    vi.mocked(sceneDataStorage.getSceneData).mockReturnValue(mockScene)

    // Act
    const scene = provider.getSceneData('test-scene')

    // Assert
    expect(sceneDataStorage.getSceneData).toHaveBeenCalledWith('test-scene')
    expect(scene).toBe(mockScene)
  })

  it('maps CSS filenames to full URLs', () => {
    // Arrange
    const { provider, cssFileStorage } = createProvider('/resources')
    vi.mocked(cssFileStorage.getCssFileNames).mockReturnValue([
      'game.css',
      'theme.css',
    ])

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
    const { provider, cssFileStorage } = createProvider()
    vi.mocked(cssFileStorage.getCssFileNames).mockReturnValue([])

    // Act
    const cssPaths = provider.getCssFilePaths()

    // Assert
    expect(cssPaths).toEqual([])
  })

  it('delegates getMapData to storage', () => {
    // Arrange
    const { provider, mapDataStorage } = createProvider()
    const mockMapData: MapData = {
      id: 'test-map',
      width: 10,
      height: 10,
      tiles: new Map(),
      squares: [],
    }
    vi.mocked(mapDataStorage.getMapData).mockReturnValue(mockMapData)

    // Act
    const mapData = provider.getMapData('test-map')

    // Assert
    expect(mapDataStorage.getMapData).toHaveBeenCalledWith('test-map')
    expect(mapData).toBe(mockMapData)
  })

  it('maps language filenames to full paths with language directory', () => {
    // Arrange
    const { provider, languageFileStorage } = createProvider('/resources')
    vi.mocked(languageFileStorage.getLanguageFileNames).mockReturnValue([
      'en/system.json',
      'en/tiles.json',
    ])

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
    const { provider, languageFileStorage } = createProvider()
    vi.mocked(languageFileStorage.getLanguageFileNames).mockReturnValue([])

    // Act
    const languagePaths = provider.getLanguageFilePaths('fr')

    // Assert
    expect(languagePaths).toEqual([])
  })

  it('constructs correct assetsUrl with different rootPaths', () => {
    // Arrange
    const { provider: provider1 } = createProvider('/game')
    const { provider: provider2 } = createProvider('/different-path')
    const { provider: provider3 } = createProvider('/data/resources')

    // Act & Assert
    expect(provider1.assetsUrl).toBe('/game/assets')
    expect(provider2.assetsUrl).toBe('/different-path/assets')
    expect(provider3.assetsUrl).toBe('/data/resources/assets')
  })
})
