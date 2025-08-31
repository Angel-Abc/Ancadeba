import { Token, token } from '@ioc/token'
import { gameLoaderToken, IGameLoader } from './gameLoader'
import { ILanguagesLoader, languagesLoaderToken } from './languagesLoader'
import { IPagesLoader, pagesLoaderToken } from './pagesLoader'

export interface ILoader {
    loadAll(): Promise<void>
}

const logName = 'Loader'
export const loaderToken = token<ILoader>(logName)
export const loaderDependencies: Token<unknown>[] = [
    gameLoaderToken,
    languagesLoaderToken,
    pagesLoaderToken
]
export class Loader implements ILoader {
    constructor(
        private gameLoader: IGameLoader,
        private languagesLoader: ILanguagesLoader,
        private pagesLoader: IPagesLoader
    ){}

    public async loadAll(): Promise<void> {
        await this.gameLoader.load()
        await Promise.all([
            this.languagesLoader.load(),
            this.pagesLoader.load()
        ])
    }
}
