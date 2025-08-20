import { Editor, editorDependencies, editorToken } from '@editor/core/editor'
import { EditorInitializer, editorInitializerDependencies, editorInitializerToken } from '@editor/core/editorInitializer'
import { GameDefinitionLoaderManager, gameDefinitionLoaderManagerDependencies, gameDefinitionLoaderManagerToken } from '@editor/managers/gameDefinitionManager'
import { EditTreeProvider, editTreeProviderDependencies, editTreeProviderToken } from '@editor/providers/editTreeProvider'
import { Container } from '@ioc/container'
import { ILogger, loggerToken } from '@utils/logger'
import { MessageBus, messageBusDependencies, messageBusToken } from '@utils/messageBus'
import { MessageQueue, messageQueueToken } from '@utils/messageQueue'

export interface IContainerBuilder {
    build(): Container
}

export class ContainerBuilder implements IContainerBuilder {
    constructor(
        private loggerFactory: () => ILogger
    ) { }

    public build(): Container {
        const logger = this.loggerFactory()
        const result = new Container(logger)
        result.register({
            token: loggerToken,
            useValue: logger
        })
        result.register({
            token: messageQueueToken,
            useFactory: c => new MessageQueue(() => { }, c.resolve(loggerToken))
        })
        result.register({
            token: messageBusToken,
            useClass: MessageBus,
            deps: messageBusDependencies
        })
        result.register({
            token: editorToken,
            useClass: Editor,
            deps: editorDependencies
        })
        result.register({
            token: editorInitializerToken,
            useClass: EditorInitializer,
            deps: editorInitializerDependencies
        })
        result.register({
            token: gameDefinitionLoaderManagerToken,
            useClass: GameDefinitionLoaderManager,
            deps: gameDefinitionLoaderManagerDependencies
        })
        result.register({
            token: editTreeProviderToken,
            useClass: EditTreeProvider,
            deps: editTreeProviderDependencies
        })
        return result
    }
}
