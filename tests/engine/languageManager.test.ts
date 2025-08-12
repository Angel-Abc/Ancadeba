import { describe, it, expect, vi } from 'vitest'
import { LanguageManager } from '../../engine/managers/languageManager'
import type { ILanguageLoader } from '../../engine/loader/languageLoader'
import type { ITranslationService } from '../../engine/services/translationService'
import type { IGameDataProvider, GameData, GameContext } from '../../engine/providers/gameDataProvider'
import type { Language } from '@loader/data/language'
import type { Game } from '@loader/data/game'

describe('LanguageManager', () => {
  it('throws when unknown language key is requested', async () => {
    const loader: ILanguageLoader = { loadLanguage: vi.fn() }
    const translationService: ITranslationService = {
      translate: vi.fn(),
      setLanguage: vi.fn()
    }
    const gameData = {
      game: { languages: {} } as unknown as Game,
      languages: {} as Record<string, Language>
    } as unknown as GameData
    const context = {} as unknown as GameContext
    const gameDataProvider: IGameDataProvider = {
      get Game() {
        return gameData
      },
      get Context() {
        return context
      },
      initialize: vi.fn()
    }

    const manager = new LanguageManager(loader, translationService, gameDataProvider)
    await expect(manager.setLanguage('unknown')).rejects.toThrow('[LanguageManager] Unknown language key: unknown')
  })
})
