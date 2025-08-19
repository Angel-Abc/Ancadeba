import { GameEngine, gameEngineDependencies, gameEngineToken } from '@core/gameEngine'
import { TurnScheduler, turnSchedulerDependencies, turnSchedulerToken } from '@core/turnScheduler'
import {
  EngineInitializer,
  engineInitializerDependencies,
  engineInitializerToken,
  actionHandlerRegistrarsToken,
  conditionResolverRegistrarsToken,
  inputsProviderRegistrarsToken,
  type ActionHandlerRegistrar,
  type ConditionResolverRegistrar,
  type InputsProviderRegistrar,
} from '@core/engineInitializer'
import { PageManagersInitializer, pageManagersInitializerDependencies, pageManagersInitializerToken } from '@core/pageManagersInitializer'
import { DialogManagersInitializer, dialogManagersInitializerDependencies, dialogManagersInitializerToken } from '@core/dialogManagersInitializer'
import { subsystemInitializersToken } from '@core/subsystemInitializer'
import { Container } from '@ioc/container'
import type { Container as IContainer } from '@ioc/types'
import { MessageBus, messageBusDependencies, messageBusToken } from '@utils/messageBus'
import { MessageQueue, messageQueueToken } from '@utils/messageQueue'
import { KeyboardEventListener, keyboardEventListenerDependencies, keyboardEventListenerToken } from '@utils/keyboardEventListener'
import { loggerToken } from '@utils/logger'
import { InputMatrixBuilder, inputMatrixBuilderDependencies, inputMatrixBuilderToken } from '@builders/inputMatrixBuilder'
import { PageInputs, pageInputsDependencies, pageInputsToken } from '@inputs/pageInputs'
import { DialogInputs, dialogInputsDependencies, dialogInputsToken } from '@inputs/dialogInputs'
import { postMessageActionToken } from '@actions/postMessageAction'
import { scriptActionToken } from '@actions/scriptAction'
import { gotoDialogToken } from '@actions/gotoDialog'
import { endDialogToken } from '@actions/endDialog'
import { scriptConditionToken } from '@conditions/scriptCondition'

/**
 * Registers core engine services like the game engine and messaging infrastructure.
 */
export class CoreBuilder {
  constructor(
    private onQueueEmptyProvider: (container: IContainer) => () => void = () => () => {},
    private actionHandlerRegistrars: ActionHandlerRegistrar[] = [],
    private conditionResolverRegistrars: ConditionResolverRegistrar[] = [],
    private inputsProviderRegistrars: InputsProviderRegistrar[] = [],
  ) {}

  /**
   * Register core dependencies into the container.
   */
  register(container: Container): void {
    container.register({
      token: actionHandlerRegistrarsToken,
      useValue: [
        (r => r.registerActionHandler('post-message', postMessageActionToken)) as ActionHandlerRegistrar,
        (r => r.registerActionHandler('script', scriptActionToken)) as ActionHandlerRegistrar,
        (r => r.registerActionHandler('goto', gotoDialogToken)) as ActionHandlerRegistrar,
        (r => r.registerActionHandler('end-dialog', endDialogToken)) as ActionHandlerRegistrar,
        ...this.actionHandlerRegistrars,
      ],
    })
    container.register({
      token: conditionResolverRegistrarsToken,
      useValue: [
        (r => r.registerConditionResolver('script', scriptConditionToken)) as ConditionResolverRegistrar,
        ...this.conditionResolverRegistrars,
      ],
    })
    container.register({
      token: inputsProviderRegistrarsToken,
      useValue: [
        (r => r.registerInputsProvider(pageInputsToken)) as InputsProviderRegistrar,
        (r => r.registerInputsProvider(dialogInputsToken)) as InputsProviderRegistrar,
        ...this.inputsProviderRegistrars,
      ],
    })
    container.register({
      token: pageManagersInitializerToken,
      useClass: PageManagersInitializer,
      deps: pageManagersInitializerDependencies
    })
    container.register({
      token: dialogManagersInitializerToken,
      useClass: DialogManagersInitializer,
      deps: dialogManagersInitializerDependencies
    })
    container.register({
      token: subsystemInitializersToken,
      useFactory: c => [
        c.resolve(pageManagersInitializerToken),
        c.resolve(dialogManagersInitializerToken),
      ],
    })
    container.register({
      token: turnSchedulerToken,
      useClass: TurnScheduler,
      deps: turnSchedulerDependencies
    })
    container.register({
      token: messageQueueToken,
      useFactory: c => new MessageQueue(this.onQueueEmptyProvider(c), c.resolve(loggerToken))
    })
    container.register({
      token: messageBusToken,
      useClass: MessageBus,
      deps: messageBusDependencies
    })
    container.register({
      token: engineInitializerToken,
      useClass: EngineInitializer,
      deps: engineInitializerDependencies
    })
    container.register({
      token: gameEngineToken,
      useClass: GameEngine,
      deps: gameEngineDependencies
    })
    container.register({
      token: keyboardEventListenerToken,
      useClass: KeyboardEventListener,
      deps: keyboardEventListenerDependencies
    })
    container.register({
      token: inputMatrixBuilderToken,
      useClass: InputMatrixBuilder,
      deps: inputMatrixBuilderDependencies
    })
    container.register({
      token: pageInputsToken,
      useClass: PageInputs,
      deps: pageInputsDependencies
    })
    container.register({
      token: dialogInputsToken,
      useClass: DialogInputs,
      deps: dialogInputsDependencies
    })
  }
}
