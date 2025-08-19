import { Editor, editorDependencies, editorToken } from '@editor/core/editor'
import { JsonFileSerive, jsonFileServiceDependencies, jsonFileServiceToken } from '@editor/services/jsonFileService'
import { Container } from '@ioc/container'
import { ILogger, loggerToken } from '@utils/logger'
import { MessageBus, messageBusDependencies, messageBusToken } from '@utils/messageBus'

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
            token: jsonFileServiceToken, 
            useClass: JsonFileSerive,
            deps: jsonFileServiceDependencies
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
        return result
    }
}
