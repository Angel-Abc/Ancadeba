import { describe, expect, it, vi } from 'vitest'
import type { ILogger } from '@ancadeba/utils'
import type {
  ILanguageDefinitionProvider,
  ITranslationProvider,
} from '../src/providers/definition/types'
import { BootstrapGameDefinition } from '../src/bootstrap/bootstrapGameDefinition'
import type { IGameStyleLoader } from '../src/styling/types'

function createLogger(): ILogger {
  return {
    debug: vi.fn((_category, message) => message),
    info: vi.fn((_category, message) => message),
    warn: vi.fn((_category, message) => message),
    error: vi.fn((_category, message) => message),
  }
}

describe('bootstrap game definition', () => {
  it('loads declared game styles before applying language bootstrap', async () => {
    // Arrange
    const calls: string[] = []
    const logger = createLogger()
    const gameStyleLoader: IGameStyleLoader = {
      loadStyles: vi.fn(async (stylePaths) => {
        calls.push(`styles:${stylePaths.join(',')}`)
      }),
    }
    const languageDefinitionProvider: ILanguageDefinitionProvider = {
      setLanguage: vi.fn(async (languageId) => {
        calls.push(`language:${languageId}`)
      }),
      getKeyValue: vi.fn((key) => key),
    }
    const translationProvider: ITranslationProvider = {
      getTranslation: vi.fn((key) => {
        calls.push(`translation:${key}`)
        return `translated:${key}`
      }),
    }
    const bootstrapGameDefinition = new BootstrapGameDefinition(
      logger,
      gameStyleLoader,
      languageDefinitionProvider,
      translationProvider,
    )

    // Act
    await bootstrapGameDefinition.execute({
      title: 'GAME.TITLE',
      version: '1.0.0',
      bootSurfaceId: 'boot-loader',
      language: 'en',
      styles: ['styles/theme.css', 'styles/layout.css'],
      surfaces: { 'boot-loader': 'surfaces/boot-loader.json' },
      widgets: { 'boot-progress': 'widgets/boot-progress.json' },
      languages: { en: ['languages/en/engine.json'] },
    })

    // Assert
    expect(gameStyleLoader.loadStyles).toHaveBeenCalledWith([
      'styles/theme.css',
      'styles/layout.css',
    ])
    expect(calls).toEqual([
      'styles:styles/theme.css,styles/layout.css',
      'language:en',
      'translation:GAME.TITLE',
    ])
    expect(logger.info).toHaveBeenCalledWith(
      'engine/bootstrap/bootstrapGameDefinition',
      'Loading game "{0}" ...',
      'translated:GAME.TITLE',
    )
  })
})
