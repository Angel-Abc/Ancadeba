import { Editor, editorDependencies, editorToken } from '@editor/core/editor'
import { EditorInitializer, editorInitializerDependencies, editorInitializerToken } from '@editor/core/editorInitializer'
import { StructureLoaderManager, structureLoaderManagerDependencies, structureLoaderManagerToken } from '@editor/managers/structureLoaderManager'
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
            token: structureLoaderManagerToken,
            useClass: StructureLoaderManager,
            deps: structureLoaderManagerDependencies
        })
        return result
    }
}
