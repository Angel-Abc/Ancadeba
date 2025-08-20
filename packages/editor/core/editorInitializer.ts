import { gameDefinitionLoaderManagerToken, IGameDefinitionLoaderManager } from '@editor/managers/gameDefinitionManager'
import { Token, token } from '@ioc/token'

export interface IEditorInitializer {
    initialize(): void
}

const logName = 'EditorInitializer'
export const editorInitializerToken = token<IEditorInitializer>(logName)
export const editorInitializerDependencies: Token<unknown>[] = [gameDefinitionLoaderManagerToken]
export class EditorInitializer implements IEditorInitializer {
    constructor(
        private structureLoaderManager: IGameDefinitionLoaderManager
    ){}

    public initialize(): void {
        this.structureLoaderManager.initialize()
    }
}
