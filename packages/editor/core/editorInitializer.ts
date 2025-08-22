import { Token, token } from '@ioc/token'
import { IManagersInitializer, managersInitializerToken } from './initializers/managersInitializer'

export interface IInitializer {
    initialize(): Promise<void>
}

export type IEditorInitializer = IInitializer

const logName = 'EditorInitializer'
export const editorInitializerToken = token<IEditorInitializer>(logName)
export const editorInitializerDependencies: Token<unknown>[] = [
    managersInitializerToken
]
export class EditorInitializer implements IEditorInitializer {
    constructor(
        private managersInitializer: IManagersInitializer
    ){}

    public async initialize(): Promise<void> {
        await this.managersInitializer.initialize()
    }
}
