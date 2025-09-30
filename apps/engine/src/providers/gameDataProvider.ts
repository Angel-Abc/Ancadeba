import { Token, token } from '@angelabc/utils/ioc'
import { GameData } from '../loaders/data/gameData'
import { gameDataLoaderToken, IGameDataLoader } from '../loaders/gameDataLoader'

export interface IGameDataProvider {
    get GameData(): GameData
}

export interface IGameDataProviderInternal extends IGameDataProvider {
    load(): Promise<void>
}

const logName = 'GameDataProvider'
export const gameDataProviderToken = token<IGameDataProvider>(logName)
export const gameDataProviderDependencies: Token<unknown>[] = [
    gameDataLoaderToken
]
export class GameDataProvider implements IGameDataProviderInternal {
    private _gameData: GameData | null = null
    constructor(
        private gameDataLoader: IGameDataLoader
    ) { }
    public get GameData(): GameData {
        if (!this._gameData) {
            throw new Error(`${logName}: GameData not loaded yet`)
        }
        return this._gameData
    }

    public async load(): Promise<void> {
        this._gameData = await this.gameDataLoader.loadGameData()
    }
}
