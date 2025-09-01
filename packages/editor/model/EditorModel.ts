import { STATE_CHANGED } from '@editor/messages/editor'
import { Token, token } from '@ioc/token'
import { IMessageBus, messageBusToken } from '@utils/messageBus'

export enum EditorState {
    init,
    loading,
    loaded,
    saving
}

export interface IEditorModel {
    get state(): EditorState
}

export type IEditorModelSet = IEditorModel & {
    set state(value: EditorState)
}

const logName = 'EditorModel'
export const editorModelToken = token<IEditorModel>(logName)
export const editorModelDependencies: Token<unknown>[] = [
    messageBusToken
]
export class EditorModel implements IEditorModelSet {
    private _state: EditorState = EditorState.init
    constructor(
        private messageBus: IMessageBus
    ){}

    public get state(): EditorState {
        return this._state
    }

    public set state(value: EditorState) {
        if (this._state !== value) {
            this._state = value    
            this.messageBus.postMessage({
                message: STATE_CHANGED,
                payload: value
            })
        }
    }
}
