import { Token, token } from '@ioc/token'
import { IInitializer } from '../editorInitializer'
import { gameDataLoaderManagerToken, IGameDataLoaderManager } from '@editor/managers/gameDataLoaderManager'

export type IManagersInitializer = IInitializer

const logName = 'ManagersInitializer'
export const managersInitializerToken = token<IManagersInitializer>(logName)
export const managersInitializerDependencies: Token<unknown>[] = [
    gameDataLoaderManagerToken,
]
export class ManagersInitializer implements IManagersInitializer {
    constructor(
        private gameDataLoaderManager: IGameDataLoaderManager,
    ){}

    public async initialize(): Promise<void> {
        await this.gameDataLoaderManager.initialize()
    }
}
