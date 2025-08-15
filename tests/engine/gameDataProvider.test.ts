import { describe, it, expect, vi } from 'vitest'
import { GameDataProvider } from '../../engine/providers/gameDataProvider'
import type { Game } from '../../engine/loader/data/game'
import * as logMessage from '../../utils/logMessage'

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
    const provider = new GameDataProvider()
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
      currentMapId: null,
      player: { position: { x: 0, y: 0 } }
    })
  })

  it('throws when accessing Game or Context before initialization', () => {
    const provider = new GameDataProvider()
    const spy = vi.spyOn(logMessage, 'fatalError')

    expect(() => provider.Game).toThrow('[GameDataProvider] Game data not loaded')
    expect(() => provider.Context).toThrow('[GameDataProvider] Game context not loaded')
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy).toHaveBeenNthCalledWith(1, 'GameDataProvider', 'Game data not loaded')
    expect(spy).toHaveBeenNthCalledWith(2, 'GameDataProvider', 'Game context not loaded')
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
    const provider = new GameDataProvider()
    provider.initialize(gameData)

    const spy = vi.spyOn(logMessage, 'fatalError')
    expect(() => provider.initialize(gameData)).toThrow('[GameDataProvider] Game data already initialized')
    expect(spy).toHaveBeenCalledWith('GameDataProvider', 'Game data already initialized')
  })
})
