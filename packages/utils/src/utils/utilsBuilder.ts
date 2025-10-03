import { Container } from '../ioc'
import { DomHelper, domHelperToken } from './domHelper'
import { ILogger, loggerToken } from './logger'
import { MessageBus, messageBusDependencies, messageBusToken } from './messageBus'
import { MessageQueue, messageQueueDependencies, messageQueueToken } from './messageQueue'

export class UtilsBuilder {
    public register(logger: ILogger, container: Container, document: Document){
        container.register({
            token: loggerToken,
            useValue: logger
        })
        container.register({
            token: messageQueueToken,
            useClass: MessageQueue,
            deps: messageQueueDependencies
        })
        container.register({
            token: messageBusToken,
            useClass: MessageBus,
            deps: messageBusDependencies
        })
        container.register({
            token: domHelperToken,
            useFactory: (_) => new DomHelper(document),
            deps: []
        })
    }
}