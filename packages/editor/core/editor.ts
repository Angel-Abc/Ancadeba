import { Token, token } from '@ioc/token'
import { ILogger, loggerToken } from '@utils/logger'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { INITIALIZED } from '@editor/messages/editor'
import { editorInitializerToken, IEditorInitializer } from './editorInitializer'
import { editorModelToken, EditorState, IEditorModelSet } from '@editor/model/EditorModel'

export interface IEditor {
    start(): Promise<void>
}

const logName = 'Editor'
export const editorToken = token<IEditor>(logName)
export const editorDependencies: Token<unknown>[] = [
    loggerToken, 
    messageBusToken, 
    editorInitializerToken,
    editorModelToken
]
export class Editor implements IEditor {
    constructor(
        private logger: ILogger,
        private messageBus: IMessageBus,
        private editorInitializer: IEditorInitializer,
        private editorModel: IEditorModelSet
    ) { }

    public async start(): Promise<void> {
        this.logger.info(logName, 'Editor start')
        this.editorModel.state = EditorState.loading
        await this.editorInitializer.initialize()
        this.editorModel.state = EditorState.loaded
        this.messageBus.postMessage({
            message: INITIALIZED,
            payload: null
        })
        this.logger.info(logName, 'Editor initialized')
    }
}
