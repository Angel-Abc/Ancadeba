import { describe, expect, it, vi } from 'vitest'
import type { IGameDataLoader } from '@ancadeba/schemas'
import type { IResourceDataProvider } from '../../resourceData/provider'
import { LanguageLoader } from '../../language/loader'

describe('language/loader', () => {
  const createMockResourceDataProvider = (): IResourceDataProvider => ({
    get assetsUrl() {
      return '/assets'
    },
    getSceneData: vi.fn(),
    getCssFilePaths: vi.fn(() => []),
    getMapData: vi.fn(),
    getItemData: vi.fn(),
    getComponentDefinition: vi.fn(),
    hasComponentDefinition: vi.fn(() => false),
    resolveComponent: vi.fn((c) => c),
    getAppearanceCategoryData: vi.fn(),
    getAppearanceData: vi.fn(),
    getAllAppearanceCategories: vi.fn(() => []),
    getAppearancesByCategory: vi.fn(() => []),
    getLanguageFilePaths: vi.fn(() => []),
  })

  const createMockGameDataLoader = (): IGameDataLoader => ({
    loadGameData: vi.fn(),
    loadLanguageData: vi.fn(async () => new Map()),
  })

  it('gets file paths from resourceDataProvider', async () => {
    // Arrange
    const resourceDataProvider = createMockResourceDataProvider()
    const gameDataLoader = createMockGameDataLoader()
    vi.mocked(resourceDataProvider.getLanguageFilePaths).mockReturnValue([
      '/resources/languages/en/system.json',
    ])
    vi.mocked(gameDataLoader.loadLanguageData).mockResolvedValue(new Map())
    const loader = new LanguageLoader(resourceDataProvider, gameDataLoader)

    // Act
    await loader.loadTranslations('en')

    // Assert
    expect(resourceDataProvider.getLanguageFilePaths).toHaveBeenCalledWith('en')
  })

  it('delegates to gameDataLoader with correct paths', async () => {
    // Arrange
    const resourceDataProvider = createMockResourceDataProvider()
    const gameDataLoader = createMockGameDataLoader()
    const filePaths = [
      '/resources/languages/en/system.json',
      '/resources/languages/en/tiles.json',
    ]
    vi.mocked(resourceDataProvider.getLanguageFilePaths).mockReturnValue(
      filePaths
    )
    vi.mocked(gameDataLoader.loadLanguageData).mockResolvedValue(new Map())
    const loader = new LanguageLoader(resourceDataProvider, gameDataLoader)

    // Act
    await loader.loadTranslations('en')

    // Assert
    expect(gameDataLoader.loadLanguageData).toHaveBeenCalledWith(filePaths)
  })

  it('returns translations map from gameDataLoader', async () => {
    // Arrange
    const resourceDataProvider = createMockResourceDataProvider()
    const gameDataLoader = createMockGameDataLoader()
    const translations = new Map([
      ['greeting', 'Hello'],
      ['farewell', 'Goodbye'],
    ])
    vi.mocked(resourceDataProvider.getLanguageFilePaths).mockReturnValue([
      '/resources/languages/en/system.json',
    ])
    vi.mocked(gameDataLoader.loadLanguageData).mockResolvedValue(translations)
    const loader = new LanguageLoader(resourceDataProvider, gameDataLoader)

    // Act
    const result = await loader.loadTranslations('en')

    // Assert
    expect(result).toBe(translations)
    expect(result.get('greeting')).toBe('Hello')
    expect(result.get('farewell')).toBe('Goodbye')
  })

  it('handles multiple language file paths', async () => {
    // Arrange
    const resourceDataProvider = createMockResourceDataProvider()
    const gameDataLoader = createMockGameDataLoader()
    const filePaths = [
      '/resources/languages/fr/system.json',
      '/resources/languages/fr/tiles.json',
      '/resources/languages/fr/items.json',
    ]
    const translations = new Map([
      ['greeting', 'Bonjour'],
      ['farewell', 'Au revoir'],
      ['thanks', 'Merci'],
    ])
    vi.mocked(resourceDataProvider.getLanguageFilePaths).mockReturnValue(
      filePaths
    )
    vi.mocked(gameDataLoader.loadLanguageData).mockResolvedValue(translations)
    const loader = new LanguageLoader(resourceDataProvider, gameDataLoader)

    // Act
    const result = await loader.loadTranslations('fr')

    // Assert
    expect(resourceDataProvider.getLanguageFilePaths).toHaveBeenCalledWith('fr')
    expect(gameDataLoader.loadLanguageData).toHaveBeenCalledWith(filePaths)
    expect(result).toBe(translations)
  })

  it('handles empty file paths', async () => {
    // Arrange
    const resourceDataProvider = createMockResourceDataProvider()
    const gameDataLoader = createMockGameDataLoader()
    const emptyTranslations = new Map()
    vi.mocked(resourceDataProvider.getLanguageFilePaths).mockReturnValue([])
    vi.mocked(gameDataLoader.loadLanguageData).mockResolvedValue(
      emptyTranslations
    )
    const loader = new LanguageLoader(resourceDataProvider, gameDataLoader)

    // Act
    const result = await loader.loadTranslations('unknown')

    // Assert
    expect(resourceDataProvider.getLanguageFilePaths).toHaveBeenCalledWith(
      'unknown'
    )
    expect(gameDataLoader.loadLanguageData).toHaveBeenCalledWith([])
    expect(result).toBe(emptyTranslations)
    expect(result.size).toBe(0)
  })

  it('loads different languages independently', async () => {
    // Arrange
    const resourceDataProvider = createMockResourceDataProvider()
    const gameDataLoader = createMockGameDataLoader()
    const englishPaths = ['/resources/languages/en/system.json']
    const spanishPaths = ['/resources/languages/es/system.json']
    const englishTranslations = new Map([['greeting', 'Hello']])
    const spanishTranslations = new Map([['greeting', 'Hola']])

    vi.mocked(resourceDataProvider.getLanguageFilePaths)
      .mockReturnValueOnce(englishPaths)
      .mockReturnValueOnce(spanishPaths)
    vi.mocked(gameDataLoader.loadLanguageData)
      .mockResolvedValueOnce(englishTranslations)
      .mockResolvedValueOnce(spanishTranslations)
    const loader = new LanguageLoader(resourceDataProvider, gameDataLoader)

    // Act
    const englishResult = await loader.loadTranslations('en')
    const spanishResult = await loader.loadTranslations('es')

    // Assert
    expect(resourceDataProvider.getLanguageFilePaths).toHaveBeenCalledTimes(2)
    expect(resourceDataProvider.getLanguageFilePaths).toHaveBeenNthCalledWith(
      1,
      'en'
    )
    expect(resourceDataProvider.getLanguageFilePaths).toHaveBeenNthCalledWith(
      2,
      'es'
    )
    expect(englishResult.get('greeting')).toBe('Hello')
    expect(spanishResult.get('greeting')).toBe('Hola')
  })

  it('returns empty map when gameDataLoader returns empty', async () => {
    // Arrange
    const resourceDataProvider = createMockResourceDataProvider()
    const gameDataLoader = createMockGameDataLoader()
    vi.mocked(resourceDataProvider.getLanguageFilePaths).mockReturnValue([
      '/resources/languages/en/system.json',
    ])
    vi.mocked(gameDataLoader.loadLanguageData).mockResolvedValue(new Map())
    const loader = new LanguageLoader(resourceDataProvider, gameDataLoader)

    // Act
    const result = await loader.loadTranslations('en')

    // Assert
    expect(result).toEqual(new Map())
    expect(result.size).toBe(0)
  })
})
