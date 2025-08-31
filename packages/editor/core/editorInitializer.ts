import { Token, token } from '@ioc/token'
import { gameModelToken, IGameModel } from '@editor/model/gameModel'

export interface IInitializer {
    initialize(): Promise<void>
}

export type IEditorInitializer = IInitializer

const logName = 'EditorInitializer'
export const editorInitializerToken = token<IEditorInitializer>(logName)
export const editorInitializerDependencies: Token<unknown>[] = [
    gameModelToken
]
export class EditorInitializer implements IEditorInitializer {
    constructor(
        private gameModel: IGameModel
    ){}

    public async initialize(): Promise<void> {
        await this.gameModel.initialize()
    }
}
