import { ILoader, loaderToken } from '@editor/loaders/loader'
import { Token, token } from '@ioc/token'

export interface IInitializer {
    initialize(): Promise<void>
}

export type IEditorInitializer = IInitializer

const logName = 'EditorInitializer'
export const editorInitializerToken = token<IEditorInitializer>(logName)
export const editorInitializerDependencies: Token<unknown>[] = [
    loaderToken
]
export class EditorInitializer implements IEditorInitializer {
    constructor(
        private loader: ILoader
    ){}

    public async initialize(): Promise<void> {
        await this.loader.loadAll()
    }
}
