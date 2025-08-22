import { Token, token } from '@ioc/token'
import { IInitializer } from '../editorInitializer'
import { gameDefinitionLoaderManagerToken, IGameDefinitionLoaderManager } from '@editor/managers/gameDefinitionLoaderManager'

export type IManagersInitializer = IInitializer

const logName = 'ManagersInitializer'
export const managersInitializerToken = token<IManagersInitializer>(logName)
export const managersInitializerDependencies: Token<unknown>[] = [
    gameDefinitionLoaderManagerToken,
]
export class ManagersInitializer implements IManagersInitializer {
    constructor(
        private gameDefinitionLoaderManager: IGameDefinitionLoaderManager,
    ){}

    public async initialize(): Promise<void> {
        await this.gameDefinitionLoaderManager.initialize()
    }
}
