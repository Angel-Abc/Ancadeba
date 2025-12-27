import { Container } from '../ioc/container'
import { ILogger, loggerToken } from '../logger/types'
import {
  MessageBus,
  messageBusDependencies,
  messageBusToken,
} from '../messages/bus'

export function registerServices(container: Container, logger: ILogger): void {
  container.registerAll([
    {
      token: loggerToken,
      useValue: logger,
    },
    {
      token: messageBusToken,
      useClass: MessageBus,
      deps: messageBusDependencies,
    },
  ])
}
