import { describe, expect, it, vi } from 'vitest'
import type { ILanguageStorage } from '../../language/storage'
import { LanguageProvider } from '../../language/provider'

describe('language/provider', () => {
  const createMockLanguageStorage = (): ILanguageStorage => ({
    setLanguage: vi.fn(),
    getTranslation: vi.fn((key: string) => key),
  })

  it('delegates getTranslation to storage', () => {
    // Arrange
    const languageStorage = createMockLanguageStorage()
    vi.mocked(languageStorage.getTranslation).mockReturnValue('Hello')
    const provider = new LanguageProvider(languageStorage)

    // Act
    const translation = provider.getTranslation('greeting')

    // Assert
    expect(languageStorage.getTranslation).toHaveBeenCalledWith('greeting')
    expect(translation).toBe('Hello')
  })

  it('returns correct translation from storage', () => {
    // Arrange
    const languageStorage = createMockLanguageStorage()
    vi.mocked(languageStorage.getTranslation).mockReturnValue('Goodbye')
    const provider = new LanguageProvider(languageStorage)

    // Act
    const translation = provider.getTranslation('farewell')

    // Assert
    expect(translation).toBe('Goodbye')
  })

  it('handles multiple translation requests', () => {
    // Arrange
    const languageStorage = createMockLanguageStorage()
    vi.mocked(languageStorage.getTranslation).mockImplementation((key) => {
      const translations: Record<string, string> = {
        greeting: 'Hello',
        farewell: 'Goodbye',
        thanks: 'Thank you',
      }
      return translations[key] || key
    })
    const provider = new LanguageProvider(languageStorage)

    // Act
    const greeting = provider.getTranslation('greeting')
    const farewell = provider.getTranslation('farewell')
    const thanks = provider.getTranslation('thanks')

    // Assert
    expect(greeting).toBe('Hello')
    expect(farewell).toBe('Goodbye')
    expect(thanks).toBe('Thank you')
  })
})
