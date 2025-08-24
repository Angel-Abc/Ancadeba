import { describe, it, expect, vi } from 'vitest'
import { EngineInitializer } from '@core/initializers/engineInitializer'
import type { ILogger } from '@utils/logger'
import type { ICoreInitializer } from '@core/initializers/coreInitializer'
import type { IProvidersInitializer } from '@core/initializers/providersInitializer'
import type { IManagersInitializer } from '@core/initializers/managersInitializer'
import type { IEngineStartInitializer } from '@core/initializers/engineStartInitializer'
import type { IRegistriesInitializer } from '@core/initializers/registriesInitializers'
import type { IGameLoader } from '@loader/gameLoader'
import type { Game } from '@loader/data/game'

describe('EngineInitializer', () => {
  it('initializes engine components in order', async () => {
    const game: Game = {
      title: 'Test Game',
      description: '',
      version: '1.0',
      initialData: { language: 'en', startPage: 'home' },
      languages: {},
      pages: {},
      maps: {},
      tiles: {},
      dialogs: {},
      actions: [],
      virtualKeys: [],
      virtualInputs: [],
      cssFiles: [],
    }

    const logger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const coreInitializer: ICoreInitializer = { initialize: vi.fn() }
    const providersInitializer: IProvidersInitializer = { initialize: vi.fn() }
    const managersInitializer: IManagersInitializer = { initialize: vi.fn() }
    const engineStartInitializer: IEngineStartInitializer = { initialize: vi.fn() }
    const registriesInitializer: IRegistriesInitializer = { initialize: vi.fn() }
    const gameLoader: IGameLoader = { loadGame: vi.fn().mockResolvedValue(game) }

    const initializer = new EngineInitializer(
      logger,
      coreInitializer,
      providersInitializer,
      managersInitializer,
      engineStartInitializer,
      gameLoader,
      registriesInitializer,
    )

    await initializer.initialize()

    expect(gameLoader.loadGame).toHaveBeenCalledTimes(1)
    expect(registriesInitializer.initialize).toHaveBeenCalledTimes(1)
    expect(coreInitializer.initialize).toHaveBeenCalledWith(game)
    expect(providersInitializer.initialize).toHaveBeenCalledWith(game)
    expect(managersInitializer.initialize).toHaveBeenCalledTimes(1)
    expect(engineStartInitializer.initialize).toHaveBeenCalledWith(game.initialData)
  })
})
