import { Container } from '@ioc/container'
import { IContainer } from '@ioc/types'
import { KeyboardEventListener, keyboardEventListenerDependencies, keyboardEventListenerToken } from '@utils/keyboardEventListener'
import { ILogger, loggerToken } from '@utils/logger'
import { MessageBus, messageBusDependencies, messageBusToken } from '@utils/messageBus'
import { MessageQueue, messageQueueToken } from '@utils/messageQueue'

export class UtilsBuilder {
    constructor(
        private logger: ILogger,
        private onQueueEmptyProvider: (container: IContainer) => () => void
    ) { }

    public register(container: Container): void {
        container.register({
            token: loggerToken,
            useValue: this.logger
        })
        container.register({
            token: messageBusToken,
            useClass: MessageBus,
            deps: messageBusDependencies
        })
        container.register({
            token: messageQueueToken,
            useFactory: c => new MessageQueue(this.onQueueEmptyProvider(c), c.resolve(loggerToken))
        })
        container.register({
            token: keyboardEventListenerToken,
            useClass: KeyboardEventListener,
            deps: keyboardEventListenerDependencies
        })
    }
}
