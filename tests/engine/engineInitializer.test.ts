import { describe, it, expect, vi } from 'vitest'
import { EngineInitializer } from '../../engine/engine/engineInitializer'
import { START_GAME_ENGINE_MESSAGE, SWITCH_PAGE } from '../../engine/messages/system'
import { postMessageActionToken } from '../../engine/actions/postMessageAction'
import type { IMessageBus } from '../../utils/messageBus'
import type { IGameLoader } from '../../engine/loader/gameLoader'
import type { IDomManager } from '../../engine/managers/domManager'
import type { ILanguageManager } from '../../engine/managers/languageManager'
import type { IGameDataProvider } from '../../engine/providers/gameDataProvider'
import type { IActionHandlerRegistry } from '../../engine/registries/actionHandlerRegistry'
import type { IPageManager } from '../../engine/managers/pageManager'
import type { IActionManager } from '../../engine/managers/actionManager'
import type { IMapManager } from '../../engine/managers/mapManager'
import type { IVirtualKeyProvider } from '../../engine/providers/virtualKeyProvider'
import type { IVirtualInputProvider } from '../../engine/providers/virtualInputProvider'
import type { Game } from '../../engine/loader/data/game'

describe('EngineInitializer', () => {
  it('initializes engine and posts start messages', async () => {
    const game: Game = {
      title: 'Test Game',
      description: '',
      version: '',
      initialData: { language: 'en', startPage: 'home' },
      languages: {},
      pages: {},
      maps: {},
      tiles: {},
      dialogs: {},
      actions: [],
      virtualKeys: [],
      virtualInputs: [],
      cssFiles: ['style1.css', 'style2.css']
    }

    const messageBus = { postMessage: vi.fn() } as unknown as IMessageBus
    const gameLoader = { loadGame: vi.fn().mockResolvedValue(game) } as unknown as IGameLoader
    const domManager = { setTitle: vi.fn(), setCssFile: vi.fn() } as unknown as IDomManager
    const languageManager = { setLanguage: vi.fn().mockResolvedValue(undefined) } as unknown as ILanguageManager
    const gameDataProvider = { initialize: vi.fn() } as unknown as IGameDataProvider
    const actionHandlerRegistry = { registerActionHandler: vi.fn() } as unknown as IActionHandlerRegistry
    const pageManager = { initialize: vi.fn() } as unknown as IPageManager
    const actionManager = { initialize: vi.fn() } as unknown as IActionManager
    const mapManager = { initialize: vi.fn() } as unknown as IMapManager
    const virtualKeyProvider = { initialize: vi.fn() } as unknown as IVirtualKeyProvider
    const virtualInputProvider = { initialize: vi.fn() } as unknown as IVirtualInputProvider

    const initializer = new EngineInitializer(
      messageBus,
      gameLoader,
      domManager,
      languageManager,
      gameDataProvider,
      actionHandlerRegistry,
      pageManager,
      actionManager,
      mapManager,
      virtualKeyProvider,
      virtualInputProvider
    )

    await initializer.initialize()

    expect(gameLoader.loadGame).toHaveBeenCalledTimes(1)
    expect(gameDataProvider.initialize).toHaveBeenCalledWith(game)
    expect(pageManager.initialize).toHaveBeenCalledTimes(1)
    expect(actionManager.initialize).toHaveBeenCalledTimes(1)
    expect(mapManager.initialize).toHaveBeenCalledTimes(1)
    expect(virtualKeyProvider.initialize).toHaveBeenCalledTimes(1)
    expect(virtualInputProvider.initialize).toHaveBeenCalledTimes(1)
    expect(languageManager.setLanguage).toHaveBeenCalledWith('en')
    expect(domManager.setTitle).toHaveBeenCalledWith('Test Game')
    expect(domManager.setCssFile).toHaveBeenCalledTimes(2)
    expect(domManager.setCssFile).toHaveBeenNthCalledWith(1, 'style1.css')
    expect(domManager.setCssFile).toHaveBeenNthCalledWith(2, 'style2.css')
    expect(actionHandlerRegistry.registerActionHandler).toHaveBeenCalledTimes(1)
    expect(actionHandlerRegistry.registerActionHandler).toHaveBeenCalledWith('post-message', postMessageActionToken)
    expect(messageBus.postMessage).toHaveBeenCalledTimes(2)
    expect(messageBus.postMessage).toHaveBeenNthCalledWith(1, { message: START_GAME_ENGINE_MESSAGE, payload: null })
    expect(messageBus.postMessage).toHaveBeenNthCalledWith(2, { message: SWITCH_PAGE, payload: 'home' })
  })
})

