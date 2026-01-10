import { describe, expect, it, vi } from 'vitest'
import type { ILanguageLoader } from '../../language/loader'
import { LanguageStorage } from '../../language/storage'

describe('language/storage', () => {
  const createMockLanguageLoader = (): ILanguageLoader => ({
    loadTranslations: vi.fn(async () => new Map()),
  })

  it('loads translations from loader when setting language', async () => {
    // Arrange
    const languageLoader = createMockLanguageLoader()
    const translations = new Map([
      ['greeting', 'Hello'],
      ['farewell', 'Goodbye'],
    ])
    vi.mocked(languageLoader.loadTranslations).mockResolvedValue(translations)
    const storage = new LanguageStorage(languageLoader)

    // Act
    await storage.setLanguage('en')

    // Assert
    expect(languageLoader.loadTranslations).toHaveBeenCalledWith('en')
    expect(storage.getTranslation('greeting')).toBe('Hello')
    expect(storage.getTranslation('farewell')).toBe('Goodbye')
  })

  it('does not reload translations when setting same language twice', async () => {
    // Arrange
    const languageLoader = createMockLanguageLoader()
    const translations = new Map([['greeting', 'Hello']])
    vi.mocked(languageLoader.loadTranslations).mockResolvedValue(translations)
    const storage = new LanguageStorage(languageLoader)

    // Act
    await storage.setLanguage('en')
    await storage.setLanguage('en')

    // Assert
    expect(languageLoader.loadTranslations).toHaveBeenCalledTimes(1)
  })

  it('returns translation value from loaded translations', async () => {
    // Arrange
    const languageLoader = createMockLanguageLoader()
    const translations = new Map([
      ['greeting', 'Bonjour'],
      ['farewell', 'Au revoir'],
    ])
    vi.mocked(languageLoader.loadTranslations).mockResolvedValue(translations)
    const storage = new LanguageStorage(languageLoader)
    await storage.setLanguage('fr')

    // Act
    const greeting = storage.getTranslation('greeting')
    const farewell = storage.getTranslation('farewell')

    // Assert
    expect(greeting).toBe('Bonjour')
    expect(farewell).toBe('Au revoir')
  })

  it('returns key as fallback when translation not found', async () => {
    // Arrange
    const languageLoader = createMockLanguageLoader()
    const translations = new Map([['greeting', 'Hello']])
    vi.mocked(languageLoader.loadTranslations).mockResolvedValue(translations)
    const storage = new LanguageStorage(languageLoader)
    await storage.setLanguage('en')

    // Act
    const result = storage.getTranslation('nonexistent')

    // Assert
    expect(result).toBe('nonexistent')
  })

  it('returns key before any language is set', () => {
    // Arrange
    const languageLoader = createMockLanguageLoader()
    const storage = new LanguageStorage(languageLoader)

    // Act
    const result = storage.getTranslation('greeting')

    // Assert
    expect(result).toBe('greeting')
  })

  it('loads new translations when setting different language', async () => {
    // Arrange
    const languageLoader = createMockLanguageLoader()
    const englishTranslations = new Map([['greeting', 'Hello']])
    const frenchTranslations = new Map([['greeting', 'Bonjour']])
    vi.mocked(languageLoader.loadTranslations)
      .mockResolvedValueOnce(englishTranslations)
      .mockResolvedValueOnce(frenchTranslations)
    const storage = new LanguageStorage(languageLoader)

    // Act
    await storage.setLanguage('en')
    const englishGreeting = storage.getTranslation('greeting')
    await storage.setLanguage('fr')
    const frenchGreeting = storage.getTranslation('greeting')

    // Assert
    expect(languageLoader.loadTranslations).toHaveBeenCalledTimes(2)
    expect(languageLoader.loadTranslations).toHaveBeenNthCalledWith(1, 'en')
    expect(languageLoader.loadTranslations).toHaveBeenNthCalledWith(2, 'fr')
    expect(englishGreeting).toBe('Hello')
    expect(frenchGreeting).toBe('Bonjour')
  })

  it('replaces all translations when switching language', async () => {
    // Arrange
    const languageLoader = createMockLanguageLoader()
    const englishTranslations = new Map([
      ['greeting', 'Hello'],
      ['farewell', 'Goodbye'],
    ])
    const spanishTranslations = new Map([
      ['greeting', 'Hola'],
      ['thanks', 'Gracias'],
    ])
    vi.mocked(languageLoader.loadTranslations)
      .mockResolvedValueOnce(englishTranslations)
      .mockResolvedValueOnce(spanishTranslations)
    const storage = new LanguageStorage(languageLoader)

    // Act
    await storage.setLanguage('en')
    await storage.setLanguage('es')

    // Assert
    expect(storage.getTranslation('greeting')).toBe('Hola')
    expect(storage.getTranslation('thanks')).toBe('Gracias')
    expect(storage.getTranslation('farewell')).toBe('farewell')
  })

  it('handles empty translations map', async () => {
    // Arrange
    const languageLoader = createMockLanguageLoader()
    const emptyTranslations = new Map()
    vi.mocked(languageLoader.loadTranslations).mockResolvedValue(
      emptyTranslations
    )
    const storage = new LanguageStorage(languageLoader)

    // Act
    await storage.setLanguage('en')
    const result = storage.getTranslation('greeting')

    // Assert
    expect(result).toBe('greeting')
  })

  it('handles multiple getTranslation calls', async () => {
    // Arrange
    const languageLoader = createMockLanguageLoader()
    const translations = new Map([
      ['greeting', 'Hello'],
      ['farewell', 'Goodbye'],
      ['thanks', 'Thank you'],
    ])
    vi.mocked(languageLoader.loadTranslations).mockResolvedValue(translations)
    const storage = new LanguageStorage(languageLoader)
    await storage.setLanguage('en')

    // Act
    const result1 = storage.getTranslation('greeting')
    const result2 = storage.getTranslation('farewell')
    const result3 = storage.getTranslation('thanks')
    const result4 = storage.getTranslation('unknown')

    // Assert
    expect(result1).toBe('Hello')
    expect(result2).toBe('Goodbye')
    expect(result3).toBe('Thank you')
    expect(result4).toBe('unknown')
  })
})
