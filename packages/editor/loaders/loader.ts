import { Token, token } from '@ioc/token'
import { gameLoaderToken, IGameLoader } from './gameLoader'
import { ILanguagesLoader, languagesLoaderToken } from './languagesLoader'

export interface ILoader {
    loadAll(): Promise<void>
}

const logName = 'Loader'
export const loaderToken = token<ILoader>(logName)
export const loaderDependencies: Token<unknown>[] = [
    gameLoaderToken,
    languagesLoaderToken
]
export class Loader implements ILoader {
    constructor(
        private gameLoader: IGameLoader,
        private languagesLoader: ILanguagesLoader
    ){}

    public async loadAll(): Promise<void> {
        await this.gameLoader.load()
        Promise.all([
            this.languagesLoader.load()
        ])
    }
}
