import { describe, expect, it, vi } from 'vitest'
import type { ILanguageLoader } from '@ancadeba/content'
import type { ILogger, IMessageBus } from '@ancadeba/utils'
import type { IGameDefinitionProvider } from '../src/providers/definition/types'
import { LanguageDefinitionProvider } from '../src/providers/definition/languageDefinitionProvider'

function createLogger(): ILogger {
  return {
    debug: vi.fn((_category, message) => message),
    info: vi.fn((_category, message) => message),
    warn: vi.fn((_category, message) => message),
    error: vi.fn((_category, message) => message),
  }
}

function createMessageBus(): IMessageBus {
  return {
    publish: vi.fn(),
    subscribe: vi.fn(() => () => undefined),
  }
}

describe('language definition provider', () => {
  it('returns intentionally empty translations without logging them as missing', async () => {
    // Arrange
    const logger = createLogger()
    const gameDefinitionProvider: IGameDefinitionProvider = {
      getGameDefinition: vi.fn(async () => ({
        title: 'GAME.TITLE',
        version: '1.0.0',
        bootSurfaceId: 'boot-loader',
        language: 'en',
        languages: { en: ['languages/en/engine.json'] },
        surfaces: { 'boot-loader': 'surfaces/boot-loader.json' },
        widgets: { 'boot-progress': 'widgets/boot-progress.json' },
      })),
    }
    const languageLoader: ILanguageLoader = {
      loadLanguage: vi.fn(async () => ({
        translations: {
          'GAME.EMPTY': '',
        },
      })),
    }
    const provider = new LanguageDefinitionProvider(
      logger,
      gameDefinitionProvider,
      languageLoader,
      createMessageBus(),
    )

    // Act
    await provider.setLanguage('en')
    const translation = provider.getKeyValue('GAME.EMPTY')

    // Assert
    expect(translation).toBe('')
    expect(logger.warn).not.toHaveBeenCalled()
  })
})
