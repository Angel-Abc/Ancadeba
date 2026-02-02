import { Container } from '../ioc/container'
import { ConsoleLogger } from '../logger/console'
import { loggerToken } from '../logger/tokens'
import { MessageBus, messageBusDependencies } from '../messageBus/bus'
import { messageBusToken } from '../messageBus/tokens'

export function registerServices(container: Container): void {
  container.registerAll([
    {
      token: loggerToken,
      useClass: ConsoleLogger,
      deps: [],
      scope: 'singleton',
    },
    {
      token: messageBusToken,
      useClass: MessageBus,
      deps: messageBusDependencies,
      scope: 'singleton',
    },
  ])
}
