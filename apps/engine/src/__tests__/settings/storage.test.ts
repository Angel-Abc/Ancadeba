import { describe, expect, it, vi } from 'vitest'
import type { ILogger } from '@ancadeba/utils'
import type { DefaultSettings } from '@ancadeba/schemas'
import type { IStorageAdapter } from '../../system/storageAdapter'
import { SettingsStorage } from '../../settings/storage'

describe('settings/storage', () => {
  const createMockLogger = (): ILogger => ({
    debug: vi.fn(() => ''),
    info: vi.fn(() => ''),
    warn: vi.fn(() => ''),
    error: vi.fn(() => ''),
    fatal: vi.fn(() => {
      throw new Error('fatal')
    }),
  })

  const createMockStorageAdapter = (): IStorageAdapter => ({
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  })

  it('initializes with null values when storage is empty', () => {
    // Arrange
    const logger = createMockLogger()
    const storageAdapter = createMockStorageAdapter()

    // Act
    const storage = new SettingsStorage(logger, storageAdapter)

    // Assert
    expect(storageAdapter.getItem).toHaveBeenCalledWith('ancadeba-settings')
    expect(() => storage.language).toThrow('fatal')
    expect(() => storage.volume).toThrow('fatal')
  })

  it('applies default settings when values are null', () => {
    // Arrange
    const logger = createMockLogger()
    const storageAdapter = createMockStorageAdapter()
    const storage = new SettingsStorage(logger, storageAdapter)
    const defaultSettings: DefaultSettings = {
      language: 'en',
      volume: 0.8,
    }

    // Act
    storage.setDefaultSettings(defaultSettings)

    // Assert
    expect(storage.language).toBe('en')
    expect(storage.volume).toBe(0.8)
    expect(storageAdapter.setItem).toHaveBeenCalledWith(
      'ancadeba-settings',
      JSON.stringify({ language: 'en', volume: 0.8 })
    )
  })

  it('does not override existing language when applying defaults', () => {
    // Arrange
    const logger = createMockLogger()
    const storageAdapter = createMockStorageAdapter()
    const storage = new SettingsStorage(logger, storageAdapter)
    storage.language = 'fr'
    const defaultSettings: DefaultSettings = {
      language: 'en',
      volume: 0.8,
    }

    // Act
    storage.setDefaultSettings(defaultSettings)

    // Assert
    expect(storage.language).toBe('fr')
    expect(storage.volume).toBe(0.8)
  })

  it('does not override existing volume when applying defaults', () => {
    // Arrange
    const logger = createMockLogger()
    const storageAdapter = createMockStorageAdapter()
    const storage = new SettingsStorage(logger, storageAdapter)
    storage.volume = 0.5
    const defaultSettings: DefaultSettings = {
      language: 'en',
      volume: 0.8,
    }

    // Act
    storage.setDefaultSettings(defaultSettings)

    // Assert
    expect(storage.language).toBe('en')
    expect(storage.volume).toBe(0.5)
  })

  it('does not override any existing settings when applying defaults', () => {
    // Arrange
    const logger = createMockLogger()
    const storageAdapter = createMockStorageAdapter()
    const storage = new SettingsStorage(logger, storageAdapter)
    storage.language = 'de'
    storage.volume = 0.3
    const defaultSettings: DefaultSettings = {
      language: 'en',
      volume: 0.8,
    }

    // Act
    storage.setDefaultSettings(defaultSettings)

    // Assert
    expect(storage.language).toBe('de')
    expect(storage.volume).toBe(0.3)
  })

  it('throws fatal error when accessing language before initialization', () => {
    // Arrange
    const logger = createMockLogger()
    const storageAdapter = createMockStorageAdapter()
    const storage = new SettingsStorage(logger, storageAdapter)

    // Act & Assert
    expect(() => storage.language).toThrow('fatal')
    expect(logger.fatal).toHaveBeenCalledWith(
      'engine/core/settings/storage',
      'Language setting is not initialized'
    )
  })

  it('throws fatal error when accessing volume before initialization', () => {
    // Arrange
    const logger = createMockLogger()
    const storageAdapter = createMockStorageAdapter()
    const storage = new SettingsStorage(logger, storageAdapter)

    // Act & Assert
    expect(() => storage.volume).toThrow('fatal')
    expect(logger.fatal).toHaveBeenCalledWith(
      'engine/core/settings/storage',
      'Volume setting is not initialized'
    )
  })

  it('updates language value when set', () => {
    // Arrange
    const logger = createMockLogger()
    const storageAdapter = createMockStorageAdapter()
    const storage = new SettingsStorage(logger, storageAdapter)
    const defaultSettings: DefaultSettings = {
      language: 'en',
      volume: 0.8,
    }
    storage.setDefaultSettings(defaultSettings)

    // Act
    storage.language = 'es'

    // Assert
    expect(storage.language).toBe('es')
    expect(storageAdapter.setItem).toHaveBeenCalledWith(
      'ancadeba-settings',
      JSON.stringify({ language: 'es', volume: 0.8 })
    )
  })

  it('updates volume value when set', () => {
    // Arrange
    const logger = createMockLogger()
    const storageAdapter = createMockStorageAdapter()
    const storage = new SettingsStorage(logger, storageAdapter)
    const defaultSettings: DefaultSettings = {
      language: 'en',
      volume: 0.8,
    }
    storage.setDefaultSettings(defaultSettings)

    // Act
    storage.volume = 0.6

    // Assert
    expect(storage.volume).toBe(0.6)
    expect(storageAdapter.setItem).toHaveBeenCalledWith(
      'ancadeba-settings',
      JSON.stringify({ language: 'en', volume: 0.6 })
    )
  })

  it('allows setting language before defaults are applied', () => {
    // Arrange
    const logger = createMockLogger()
    const storageAdapter = createMockStorageAdapter()
    const storage = new SettingsStorage(logger, storageAdapter)

    // Act
    storage.language = 'ja'

    // Assert
    expect(storage.language).toBe('ja')
  })

  it('allows setting volume before defaults are applied', () => {
    // Arrange
    const logger = createMockLogger()
    const storageAdapter = createMockStorageAdapter()
    const storage = new SettingsStorage(logger, storageAdapter)

    // Act
    storage.volume = 0.2

    // Assert
    expect(storage.volume).toBe(0.2)
  })

  it('loads settings from storage on initialization', () => {
    // Arrange
    const logger = createMockLogger()
    const storageAdapter = createMockStorageAdapter()
    vi.mocked(storageAdapter.getItem).mockReturnValue(
      JSON.stringify({ language: 'fr', volume: 0.7 })
    )

    // Act
    const storage = new SettingsStorage(logger, storageAdapter)

    // Assert
    expect(storageAdapter.getItem).toHaveBeenCalledWith('ancadeba-settings')
    expect(storage.language).toBe('fr')
    expect(storage.volume).toBe(0.7)
  })

  it('handles invalid JSON in storage gracefully', () => {
    // Arrange
    const logger = createMockLogger()
    const storageAdapter = createMockStorageAdapter()
    vi.mocked(storageAdapter.getItem).mockReturnValue('invalid-json')

    // Act
    const storage = new SettingsStorage(logger, storageAdapter)

    // Assert
    expect(() => storage.language).toThrow('fatal')
    expect(() => storage.volume).toThrow('fatal')
  })

  it('handles partial settings in storage', () => {
    // Arrange
    const logger = createMockLogger()
    const storageAdapter = createMockStorageAdapter()
    vi.mocked(storageAdapter.getItem).mockReturnValue(
      JSON.stringify({ language: 'de' })
    )

    // Act
    const storage = new SettingsStorage(logger, storageAdapter)

    // Assert
    expect(storage.language).toBe('de')
    expect(() => storage.volume).toThrow('fatal')
  })

  it('persists settings after each update', () => {
    // Arrange
    const logger = createMockLogger()
    const storageAdapter = createMockStorageAdapter()
    const storage = new SettingsStorage(logger, storageAdapter)
    const defaultSettings: DefaultSettings = {
      language: 'en',
      volume: 0.8,
    }
    storage.setDefaultSettings(defaultSettings)
    vi.mocked(storageAdapter.setItem).mockClear()

    // Act
    storage.language = 'jp'
    storage.volume = 0.5

    // Assert
    expect(storageAdapter.setItem).toHaveBeenCalledTimes(2)
    expect(storageAdapter.setItem).toHaveBeenNthCalledWith(
      1,
      'ancadeba-settings',
      JSON.stringify({ language: 'jp', volume: 0.8 })
    )
    expect(storageAdapter.setItem).toHaveBeenNthCalledWith(
      2,
      'ancadeba-settings',
      JSON.stringify({ language: 'jp', volume: 0.5 })
    )
  })
})
