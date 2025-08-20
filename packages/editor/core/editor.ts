import { INITIALIZED } from '@editor/messages/editor'
import { Token, token } from '@ioc/token'
import { ILogger, loggerToken } from '@utils/logger'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { editorInitializerToken, IEditorInitializer } from './editorInitializer'

export interface IEditor {
    start(): Promise<void>
}

const logName = 'Editor'
export const editorToken = token<IEditor>(logName)
export const editorDependencies: Token<unknown>[] = [loggerToken, messageBusToken, editorInitializerToken]
export class Editor implements IEditor {
    constructor(
        private logger: ILogger,
        private messageBus: IMessageBus,
        private editorInitializer: IEditorInitializer
    ) { }

    public async start(): Promise<void> {
        this.logger.info(logName, 'Editor start')
        this.editorInitializer.initialize()
        this.messageBus.postMessage({
            message: INITIALIZED,
            payload: null
        })
        this.logger.info(logName, 'Editor initialized')
    }
}
