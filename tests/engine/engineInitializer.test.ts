import { describe, it, expect, vi } from 'vitest'
import { EngineInitializer, type ActionHandlerRegistrar, type ConditionResolverRegistrar, type InputsProviderRegistrar } from '../../engine/core/engineInitializer'
import type { ILogger } from '@utils/logger'
import { START_GAME_ENGINE_MESSAGE, SWITCH_PAGE } from '../../engine/messages/system'
import { postMessageActionToken } from '../../engine/actions/postMessageAction'
import { scriptActionToken } from '../../engine/actions/scriptAction'
import { gotoDialogToken } from '../../engine/actions/gotoDialog'
import { endDialogToken } from '../../engine/actions/endDialog'
import { scriptConditionToken } from '../../engine/conditions/scriptCondition'
import { pageInputsToken } from '../../engine/inputs/pageInputs'
import { dialogInputsToken } from '../../engine/inputs/dialogInputs'
import { token } from '../../engine/ioc/token'
import type { IActionHandler } from '../../engine/registries/actionHandlerRegistry'
import type { IConditionResolver } from '../../engine/registries/conditionResolverRegistry'
import type { IInputsProvider } from '../../engine/registries/inputsProviderRegistry'
import type { Condition } from '../../engine/loader/data/condition'
import type { IMessageBus } from '../../utils/messageBus'
import type { IGameLoader } from '../../engine/loader/gameLoader'
import type { IDomManager } from '@managers/domManager'
import type { ILanguageManager } from '@managers/languageManager'
import type { IGameDataProvider } from '../../engine/providers/gameDataProvider'
import type { IActionHandlerRegistry } from '../../engine/registries/actionHandlerRegistry'
import type { IConditionResolverRegistry } from '../../engine/registries/conditionResolverRegistry'
import type { IPageManager } from '@managers/pageManager'
import type { IActionManager } from '@managers/actionManager'
import type { IMapManager } from '@managers/mapManager'
import type { IVirtualKeyProvider } from '../../engine/providers/virtualKeyProvider'
import type { IVirtualInputProvider } from '../../engine/providers/virtualInputProvider'
import type { ITurnManager } from '@managers/turnManager'
import type { IInputsProviderRegistry } from '../../engine/registries/inputsProviderRegistry'
import type { IInputManager } from '@managers/inputManager'
import type { IPlayerPositionManager } from '@managers/playerPositionManager'
import type { Game } from '../../engine/loader/data/game'
import type { ITileTriggerManager } from '@managers/tileTriggerManager'
import { IDialogSetManager } from '@managers/dialogSetManager'
import { IDialogManager } from '@managers/dialogManager'
import { IDialogOutputManager } from '@managers/dialogOutputManager'
import { ITurnOutputManager } from '@managers/turnOutputManager'

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
    const tileTriggerManager = { initialize: vi.fn() } as unknown as ITileTriggerManager
    const dialogSetManager = { initialize: vi.fn() } as unknown as IDialogSetManager
    const dialogManager = { initialize: vi.fn() } as unknown as IDialogManager
    const dialogOutputManager = { initialize: vi.fn() } as unknown as IDialogOutputManager
    const turnOutputManager = { initialize: vi.fn() } as unknown as ITurnOutputManager

    const customActionToken = token<IActionHandler>('custom-action')
    const customConditionToken = token<IConditionResolver>('custom-condition')
    const customInputsToken = token<IInputsProvider>('custom-inputs')

    const actionRegistrars: ActionHandlerRegistrar[] = [
      r => r.registerActionHandler('post-message', postMessageActionToken),
      r => r.registerActionHandler('script', scriptActionToken),
      r => r.registerActionHandler('goto', gotoDialogToken),
      r => r.registerActionHandler('end-dialog', endDialogToken),
      r => r.registerActionHandler('custom' as any, customActionToken),
    ]
    const conditionRegistrars: ConditionResolverRegistrar[] = [
      r => r.registerConditionResolver('script', scriptConditionToken),
      r => r.registerConditionResolver('custom-cond' as Condition['type'], customConditionToken),
    ]
    const inputsRegistrars: InputsProviderRegistrar[] = [
      r => r.registerInputsProvider(pageInputsToken),
      r => r.registerInputsProvider(dialogInputsToken),
      r => r.registerInputsProvider(customInputsToken),
    ]

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
      playerPositionManager,
      tileTriggerManager,
      dialogSetManager,
      dialogManager,
      dialogOutputManager,
      turnOutputManager,
      actionRegistrars,
      conditionRegistrars,
      inputsRegistrars,
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
    expect(tileTriggerManager.initialize).toHaveBeenCalledTimes(1)
    expect(dialogSetManager.initialize).toHaveBeenCalledTimes(1)
    expect(dialogManager.initialize).toHaveBeenCalledTimes(1)
    expect(dialogOutputManager.initialize).toHaveBeenCalledTimes(1)
    expect(turnOutputManager.initialize).toHaveBeenCalledTimes(1)
    expect(languageManager.setLanguage).toHaveBeenCalledWith('en')
    expect(domManager.setTitle).toHaveBeenCalledWith('Test Game')
    expect(domManager.setCssFile).toHaveBeenCalledTimes(2)
    expect(domManager.setCssFile).toHaveBeenNthCalledWith(1, 'style1.css')
    expect(domManager.setCssFile).toHaveBeenNthCalledWith(2, 'style2.css')
    expect(actionHandlerRegistry.registerActionHandler).toHaveBeenCalledTimes(5)
    expect(actionHandlerRegistry.registerActionHandler).toHaveBeenNthCalledWith(1, 'post-message', postMessageActionToken)
    expect(actionHandlerRegistry.registerActionHandler).toHaveBeenNthCalledWith(2, 'script', scriptActionToken)
    expect(actionHandlerRegistry.registerActionHandler).toHaveBeenNthCalledWith(3, 'goto', gotoDialogToken)
    expect(actionHandlerRegistry.registerActionHandler).toHaveBeenNthCalledWith(4, 'end-dialog', endDialogToken)
    expect(actionHandlerRegistry.registerActionHandler).toHaveBeenNthCalledWith(5, 'custom', customActionToken)
    expect(conditionResolverRegistry.registerConditionResolver).toHaveBeenCalledTimes(2)
    expect(conditionResolverRegistry.registerConditionResolver).toHaveBeenNthCalledWith(1, 'script', scriptConditionToken)
    expect(conditionResolverRegistry.registerConditionResolver).toHaveBeenNthCalledWith(2, 'custom-cond', customConditionToken)
    expect(inputsProviderRegistry.registerInputsProvider).toHaveBeenCalledTimes(3)
    expect(inputsProviderRegistry.registerInputsProvider).toHaveBeenNthCalledWith(1, pageInputsToken)
    expect(inputsProviderRegistry.registerInputsProvider).toHaveBeenNthCalledWith(2, dialogInputsToken)
    expect(inputsProviderRegistry.registerInputsProvider).toHaveBeenNthCalledWith(3, customInputsToken)
    expect(messageBus.postMessage).toHaveBeenCalledTimes(2)
    expect(messageBus.postMessage).toHaveBeenNthCalledWith(1, { message: START_GAME_ENGINE_MESSAGE, payload: null })
    expect(messageBus.postMessage).toHaveBeenNthCalledWith(2, { message: SWITCH_PAGE, payload: 'home' })
  })
})

