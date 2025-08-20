import { IStructureLoaderManager, structureLoaderManagerToken } from '@editor/managers/structureLoaderManager'
import { Token, token } from '@ioc/token'

export interface IEditorInitializer {
    initialize(): void
}

const logName = 'EditorInitializer'
export const editorInitializerToken = token<IEditorInitializer>(logName)
export const editorInitializerDependencies: Token<unknown>[] = [structureLoaderManagerToken]
export class EditorInitializer implements IEditorInitializer {
    constructor(
        private structureLoaderManager: IStructureLoaderManager
    ){}

    public initialize(): void {
        this.structureLoaderManager.initialize()
    }
}
