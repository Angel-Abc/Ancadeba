import { describe, it, expect, vi } from 'vitest'
import { GameDataProvider } from '../../engine/providers/gameDataProvider'
import type { Game } from '../../engine/loader/data/game'
import type { ILogger } from '../../utils/logger'

describe('GameDataProvider', () => {
  it('initializes game and context', () => {
    const gameData: Game = {
      title: 'Test',
      description: 'desc',
      version: '1.0',
      initialData: { language: 'en', startPage: 'start' },
      languages: {},
      pages: {},
      maps: {},
      tiles: {},
      dialogs: {},
      actions: [],
      virtualKeys: [],
      virtualInputs: [],
      cssFiles: []
    }
    const logger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn((c, m) => `[${c}] ${m}`) }
    const provider = new GameDataProvider(logger)
    provider.initialize(gameData)

    expect(provider.Game.game).toBe(gameData)
    expect(provider.Game.loadedLanguages).toEqual({})
    expect(provider.Game.loadedPages).toEqual({})
    expect(provider.Game.loadedMaps).toEqual({})
    expect(provider.Game.loadedTileSets).toEqual(new Set())
    expect(provider.Game.loadedTiles).toEqual(new Map())
    expect(provider.Context).toEqual({
      language: 'en',
      startPage: 'start',
      currentPageId: null,
      currentMap: {
        id: null,
        width: 0,
        height: 0
      },
      isInModalDialog: false,
      player: { position: { x: 0, y: 0 } },
      currentDialogSet: { dialogSetId: null, dialogId: null }
      ,
      turnOutputs: [ { outputs: [] } ]
    })
  })

  it('throws when accessing Game or Context before initialization', () => {
    const logger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn((c, m) => `[${c}] ${m}`) }
    const provider = new GameDataProvider(logger)

    expect(() => provider.Game).toThrow('[GameDataProvider] Game data not loaded')
    expect(() => provider.Context).toThrow('[GameDataProvider] Game context not loaded')
    expect(logger.error).toHaveBeenCalledTimes(2)
    expect(logger.error).toHaveBeenNthCalledWith(1, 'GameDataProvider', 'Game data not loaded')
    expect(logger.error).toHaveBeenNthCalledWith(2, 'GameDataProvider', 'Game context not loaded')
  })

  it('throws when initialized twice', () => {
    const gameData: Game = {
      title: 'Test',
      description: 'desc',
      version: '1.0',
      initialData: { language: 'en', startPage: 'start' },
      languages: {},
      pages: {},
      maps: {},
      tiles: {},
      dialogs: {},
      actions: [],
      virtualKeys: [],
      virtualInputs: [],
      cssFiles: []
    }
    const logger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn((c, m) => `[${c}] ${m}`) }
    const provider = new GameDataProvider(logger)
    provider.initialize(gameData)

    expect(() => provider.initialize(gameData)).toThrow('[GameDataProvider] Game data already initialized')
    expect(logger.error).toHaveBeenCalledWith('GameDataProvider', 'Game data already initialized')
  })
})
