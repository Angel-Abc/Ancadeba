import { describe, it, expect, vi } from 'vitest'
import { EngineInitializer, type ActionHandlerRegistrar, type ConditionResolverRegistrar, type InputsProviderRegistrar } from '../../packages/engine/core/engineInitializer'
import type { ILogger } from '@utils/logger'
import { START_GAME_ENGINE_MESSAGE, SWITCH_PAGE } from '../../packages/engine/messages/system'
import { postMessageActionToken } from '../../packages/engine/actions/postMessageAction'
import { scriptActionToken } from '../../packages/engine/actions/scriptAction'
import { gotoDialogToken } from '../../packages/engine/actions/gotoDialog'
import { endDialogToken } from '../../packages/engine/actions/endDialog'
import { scriptConditionToken } from '../../packages/engine/conditions/scriptCondition'
import { pageInputsToken } from '../../packages/engine/inputs/pageInputs'
import { dialogInputsToken } from '../../packages/engine/inputs/dialogInputs'
import { token } from '@ioc/token'
import type { IActionHandler } from '../../packages/engine/registries/actionHandlerRegistry'
import type { IConditionResolver } from '../../packages/engine/registries/conditionResolverRegistry'
import type { IInputsProvider } from '../../packages/engine/registries/inputsProviderRegistry'
import type { Condition } from '../../packages/engine/loader/data/condition'
import type { BaseAction } from '../../packages/engine/loader/data/action'
import type { IMessageBus } from '@utils/messageBus'
import type { IGameLoader } from '../../packages/engine/loader/gameLoader'
import type { IDomManager } from '@managers/domManager'
import type { ILanguageManager } from '@managers/languageManager'
import type { IGameDataProvider } from '../../packages/engine/providers/gameDataProvider'
import type { IActionHandlerRegistry } from '../../packages/engine/registries/actionHandlerRegistry'
import type { IConditionResolverRegistry } from '../../packages/engine/registries/conditionResolverRegistry'
import type { IInputsProviderRegistry } from '../../packages/engine/registries/inputsProviderRegistry'
import type { Game } from '../../packages/engine/loader/data/game'
import type { ISubsystemInitializer } from '../../packages/engine/core/subsystemInitializer'

interface CustomAction extends BaseAction {
  type: 'custom'
}

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
      cssFiles: ['style1.css', 'style2.css'],
    }

    const messageBus = { postMessage: vi.fn() } as unknown as IMessageBus
    const gameLoader = { loadGame: vi.fn().mockResolvedValue(game) } as unknown as IGameLoader
    const domManager = { setTitle: vi.fn(), setCssFile: vi.fn() } as unknown as IDomManager
    const languageManager = { setLanguage: vi.fn().mockResolvedValue(undefined) } as unknown as ILanguageManager
    const gameDataProvider = { initialize: vi.fn() } as unknown as IGameDataProvider
    const actionHandlerRegistry = { registerActionHandler: vi.fn() } as unknown as IActionHandlerRegistry
    const conditionResolverRegistry = { registerConditionResolver: vi.fn() } as unknown as IConditionResolverRegistry
    const inputsProviderRegistry = { registerInputsProvider: vi.fn() } as unknown as IInputsProviderRegistry

    const subsystemInitializerA = { initialize: vi.fn() } as unknown as ISubsystemInitializer
    const subsystemInitializerB = { initialize: vi.fn() } as unknown as ISubsystemInitializer

    const customActionToken = token<IActionHandler<CustomAction>>('custom-action')
    const customConditionToken = token<IConditionResolver>('custom-condition')
    const customInputsToken = token<IInputsProvider>('custom-inputs')

    const actionRegistrars: ActionHandlerRegistrar[] = [
      r => r.registerActionHandler('post-message', postMessageActionToken),
      r => r.registerActionHandler('script', scriptActionToken),
      r => r.registerActionHandler('goto', gotoDialogToken),
      r => r.registerActionHandler('end-dialog', endDialogToken),
      r => r.registerActionHandler<CustomAction>('custom', customActionToken),
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
      logger,
      inputsProviderRegistry,
      [subsystemInitializerA, subsystemInitializerB],
      actionRegistrars,
      conditionRegistrars,
      inputsRegistrars,
    )

    await initializer.initialize()

    expect(gameLoader.loadGame).toHaveBeenCalledTimes(1)
    expect(gameDataProvider.initialize).toHaveBeenCalledWith(game)
    expect(subsystemInitializerA.initialize).toHaveBeenCalledTimes(1)
    expect(subsystemInitializerB.initialize).toHaveBeenCalledTimes(1)
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

