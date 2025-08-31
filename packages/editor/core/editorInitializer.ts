import { Token, token } from '@ioc/token'

export interface IInitializer {
    initialize(): Promise<void>
}

export type IEditorInitializer = IInitializer

const logName = 'EditorInitializer'
export const editorInitializerToken = token<IEditorInitializer>(logName)
export const editorInitializerDependencies: Token<unknown>[] = [
]
export class EditorInitializer implements IEditorInitializer {
    constructor(
    ){}

    public async initialize(): Promise<void> {
    }
}
