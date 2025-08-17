import { describe, it, expect, vi } from 'vitest'
import { EngineInitializer } from '../../engine/core/engineInitializer'
import type { ILogger } from '@utils/logger'
import { START_GAME_ENGINE_MESSAGE, SWITCH_PAGE } from '../../engine/messages/system'
import { postMessageActionToken } from '../../engine/actions/postMessageAction'
import { scriptActionToken } from '../../engine/actions/scriptAction'
import { scriptConditionToken } from '../../engine/conditions/scriptCondition'
import type { IMessageBus } from '../../utils/messageBus'
import type { IGameLoader } from '../../engine/loader/gameLoader'
import type { IDomManager } from '../../engine/managers/domManager'
import type { ILanguageManager } from '../../engine/managers/languageManager'
import type { IGameDataProvider } from '../../engine/providers/gameDataProvider'
import type { IActionHandlerRegistry } from '../../engine/registries/actionHandlerRegistry'
import type { IConditionResolverRegistry } from '../../engine/registries/conditionResolverRegistry'
import type { IPageManager } from '../../engine/managers/pageManager'
import type { IActionManager } from '../../engine/managers/actionManager'
import type { IMapManager } from '../../engine/managers/mapManager'
import type { IVirtualKeyProvider } from '../../engine/providers/virtualKeyProvider'
import type { IVirtualInputProvider } from '../../engine/providers/virtualInputProvider'
import type { ITurnManager } from '../../engine/managers/turnManager'
import type { IInputsProviderRegistry } from '../../engine/registries/inputsProviderRegistry'
import type { IInputManager } from '../../engine/managers/inputManager'
import type { IPlayerPositionManager } from '../../engine/managers/playerPositionManager'
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
    const conditionResolverRegistry = { registerConditionResolver: vi.fn() } as unknown as IConditionResolverRegistry
    const pageManager = { initialize: vi.fn() } as unknown as IPageManager
    const actionManager = { initialize: vi.fn() } as unknown as IActionManager
    const mapManager = { initialize: vi.fn() } as unknown as IMapManager
    const virtualKeyProvider = { initialize: vi.fn() } as unknown as IVirtualKeyProvider
    const virtualInputProvider = { initialize: vi.fn() } as unknown as IVirtualInputProvider
    const turnManager = { initialize: vi.fn() } as unknown as ITurnManager
    const inputsProviderRegistry = { registerInputsProvider: vi.fn() } as unknown as IInputsProviderRegistry
    const inputManager = { initialize: vi.fn() } as unknown as IInputManager
    const playerPositionManager = { initialize: vi.fn() } as unknown as IPlayerPositionManager

    const logger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const initializer = new EngineInitializer(
      messageBus,
      gameLoader,
      domManager,
      languageManager,
      gameDataProvider,
      actionHandlerRegistry,
      conditionResolverRegistry,
      pageManager,
      actionManager,
      mapManager,
      virtualKeyProvider,
      virtualInputProvider,
      logger,
      turnManager,
      inputsProviderRegistry,
      inputManager,
      playerPositionManager
    )

    await initializer.initialize()

    expect(gameLoader.loadGame).toHaveBeenCalledTimes(1)
    expect(gameDataProvider.initialize).toHaveBeenCalledWith(game)
    expect(pageManager.initialize).toHaveBeenCalledTimes(1)
    expect(actionManager.initialize).toHaveBeenCalledTimes(1)
    expect(mapManager.initialize).toHaveBeenCalledTimes(1)
    expect(turnManager.initialize).toHaveBeenCalledTimes(1)
    expect(inputManager.initialize).toHaveBeenCalledTimes(1)
    expect(playerPositionManager.initialize).toHaveBeenCalledTimes(1)
    expect(virtualKeyProvider.initialize).toHaveBeenCalledTimes(1)
    expect(virtualInputProvider.initialize).toHaveBeenCalledTimes(1)
    expect(languageManager.setLanguage).toHaveBeenCalledWith('en')
    expect(domManager.setTitle).toHaveBeenCalledWith('Test Game')
    expect(domManager.setCssFile).toHaveBeenCalledTimes(2)
    expect(domManager.setCssFile).toHaveBeenNthCalledWith(1, 'style1.css')
    expect(domManager.setCssFile).toHaveBeenNthCalledWith(2, 'style2.css')
    expect(actionHandlerRegistry.registerActionHandler).toHaveBeenCalledTimes(2)
    expect(actionHandlerRegistry.registerActionHandler).toHaveBeenNthCalledWith(1, 'post-message', postMessageActionToken)
    expect(actionHandlerRegistry.registerActionHandler).toHaveBeenNthCalledWith(2, 'script', scriptActionToken)
    expect(conditionResolverRegistry.registerConditionResolver).toHaveBeenCalledWith('script', scriptConditionToken)
    expect(messageBus.postMessage).toHaveBeenCalledTimes(2)
    expect(messageBus.postMessage).toHaveBeenNthCalledWith(1, { message: START_GAME_ENGINE_MESSAGE, payload: null })
    expect(messageBus.postMessage).toHaveBeenNthCalledWith(2, { message: SWITCH_PAGE, payload: 'home' })
  })
})

