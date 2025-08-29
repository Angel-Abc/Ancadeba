import { describe, it, expect, vi } from 'vitest'
import { LanguageManager } from '../../packages/engine/managers/languageManager'
import { LanguageLoader, type ILanguageLoader } from '../../packages/engine/loader/languageLoader'
import type { ILogger } from '@utils/logger'
import type { ITranslationService } from '../../packages/engine/services/translationService'
import type { IGameDataProvider, GameData, GameContext } from '../../packages/engine/providers/gameDataProvider'
import type { Language } from '@loader/data/language'
import type { Game } from '@loader/data/game'

describe('LanguageManager', () => {
  it('throws when unknown language key is requested', async () => {
    const loader: ILanguageLoader = { loadLanguage: vi.fn() }
    const translationService: ITranslationService = {
      translate: vi.fn(),
      setLanguage: vi.fn()
    }
    const logger: ILogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn((category, message, ...args) => {
        const formatted = message.replace(/\{(\d+)\}/g, (_: string, i: string) => String(args[Number(i)]))
        return `[${category}] ${formatted}`
      })
    }
    const gameData = {
      game: { languages: {} } as unknown as Game,
      loadedLanguages: {} as Record<string, Language>
    } as unknown as GameData
    const context = {} as unknown as GameContext
    const gameDataProvider: IGameDataProvider = {
      get game() {
        return gameData
      },
      get context() {
        return context
      },
      initialize: vi.fn()
    }

    const manager = new LanguageManager(loader, translationService, gameDataProvider, logger)
    await expect(manager.setLanguage('unknown')).rejects.toThrow('[LanguageManager] Unknown language key: unknown')
  })

  it('throws when language paths are empty', async () => {
    const logger: ILogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn((category, message, ...args) => {
        const formatted = message.replace(/\{(\d+)\}/g, (_: string, i: string) => String(args[Number(i)]))
        return `[${category}] ${formatted}`
      })
    }
    const loader = new LanguageLoader({ dataPath: '' }, logger)
    const translationService: ITranslationService = {
      translate: vi.fn(),
      setLanguage: vi.fn()
    }
    const gameData = {
      game: { languages: { empty: [] } } as unknown as Game,
      loadedLanguages: {} as Record<string, Language>
    } as unknown as GameData
    const context = {} as unknown as GameContext
    const gameDataProvider: IGameDataProvider = {
      get game() {
        return gameData
      },
      get context() {
        return context
      },
      initialize: vi.fn()
    }

    const manager = new LanguageManager(loader, translationService, gameDataProvider, logger)
    await expect(manager.setLanguage('empty')).rejects.toThrow('No language paths provided')
  })
})
