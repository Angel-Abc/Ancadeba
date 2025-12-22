import { Container } from '../ioc/container'
import { ILogger, loggerToken } from '../logger/types'
import {
  MessageBus,
  messageBusDependencies,
  messageBusToken,
} from '../messages/bus'
import { DomHelper, domHelperToken } from './domHelper'

export function registerServices(
  container: Container,
  logger: ILogger,
  document: Document
): void {
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
    {
      token: domHelperToken,
      useFactory: () => new DomHelper(document),
    },
  ])
}
