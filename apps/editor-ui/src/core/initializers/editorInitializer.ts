import { Token, token } from '@angelabc/utils/ioc'

export interface IEditorInitializer {
    initialize(): void
}

const logName = 'EditorInitializer'
export const editorInitializerToken = token<IEditorInitializer>(logName)
export const editorInitializerDependencies: Token<unknown>[] = []
export class EditorInitializer implements IEditorInitializer {
    constructor(){}
    public initialize(): void {
        // TODO
    }
}