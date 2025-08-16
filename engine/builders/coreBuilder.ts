import { GameEngine, gameEngineDependencies, gameEngineToken } from '@engine/gameEngine'
import { TurnScheduler, turnSchedulerDependencies, turnSchedulerToken } from '@engine/turnScheduler'
import { EngineInitializer, engineInitializerDependencies, engineInitializerToken } from '@engine/engineInitializer'
import { Container } from '@ioc/container'
import type { Container as IContainer } from '@ioc/types'
import { MessageBus, messageBusDependencies, messageBusToken } from '@utils/messageBus'
import { MessageQueue, messageQueueToken } from '@utils/messageQueue'
import { KeyboardEventListener, keyboardeventListenerDependencies, keyboardeventListenerToken } from '@utils/keyboardEventListener'
import { loggerToken } from '@utils/logger'

/**
 * Registers core engine services like the game engine and messaging infrastructure.
 */
export class CoreBuilder {
  constructor(private onQueueEmptyProvider: (container: IContainer) => () => void = () => () => {}) {}

  /**
   * Register core dependencies into the container.
   */
  register(container: Container): void {
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
      token: keyboardeventListenerToken,
      useClass: KeyboardEventListener,
      deps: keyboardeventListenerDependencies
    })
  }
}

