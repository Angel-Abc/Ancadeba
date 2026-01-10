import { describe, expect, it, vi } from 'vitest'
import type { ISettingsStorage } from '../../settings/storage'
import { SettingsProvider } from '../../settings/provider'

describe('settings/provider', () => {
  const createMockSettingsStorage = (): ISettingsStorage => ({
    setDefaultSettings: vi.fn(),
    language: 'en',
    volume: 0.8,
  })

  it('returns language from storage', () => {
    // Arrange
    const settingsStorage = createMockSettingsStorage()
    settingsStorage.language = 'fr'
    const provider = new SettingsProvider(settingsStorage)

    // Act
    const language = provider.language

    // Assert
    expect(language).toBe('fr')
  })

  it('returns volume from storage', () => {
    // Arrange
    const settingsStorage = createMockSettingsStorage()
    settingsStorage.volume = 0.6
    const provider = new SettingsProvider(settingsStorage)

    // Act
    const volume = provider.volume

    // Assert
    expect(volume).toBe(0.6)
  })

  it('reflects changes in storage language', () => {
    // Arrange
    const settingsStorage = createMockSettingsStorage()
    settingsStorage.language = 'en'
    const provider = new SettingsProvider(settingsStorage)

    // Act
    settingsStorage.language = 'es'
    const language = provider.language

    // Assert
    expect(language).toBe('es')
  })

  it('reflects changes in storage volume', () => {
    // Arrange
    const settingsStorage = createMockSettingsStorage()
    settingsStorage.volume = 0.5
    const provider = new SettingsProvider(settingsStorage)

    // Act
    settingsStorage.volume = 0.9
    const volume = provider.volume

    // Assert
    expect(volume).toBe(0.9)
  })
})
