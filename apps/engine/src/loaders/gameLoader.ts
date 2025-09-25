import { Token, token } from '@angelabc/utils/ioc'

export interface IGameLoader {
    loadGameData(): void
}

const logName = 'GameLoader'
export const gameLoaderToken = token<IGameLoader>(logName)
export const gameLoaderDependencies: Token<unknown>[] = []
export class GameLoader implements IGameLoader {
    constructor() { }
    public loadGameData(): void {

    }
}