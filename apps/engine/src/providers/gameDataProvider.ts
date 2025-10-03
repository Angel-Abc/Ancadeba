import { Token, token } from '@angelabc/utils/ioc'
import { GameData } from '../loaders/data/gameData'
import { gameDataLoaderToken, IGameDataLoader } from '../loaders/gameDataLoader'
import { IMessageBus, messageBusToken } from '@angelabc/utils/utils'
import { MESSAGE_ENGINE_GAME_DATA_LOADED } from '../core/messages'

export interface IGameDataProvider {
    get GameData(): GameData
}

export interface IGameDataProviderInternal extends IGameDataProvider {
    load(): Promise<void>
}

const logName = 'GameDataProvider'
export const gameDataProviderToken = token<IGameDataProvider>(logName)
export const gameDataProviderDependencies: Token<unknown>[] = [
    gameDataLoaderToken,
    messageBusToken
]
export class GameDataProvider implements IGameDataProviderInternal {
    private _gameData: GameData | null = null
    constructor(
        private gameDataLoader: IGameDataLoader,
        private messageBus: IMessageBus
    ) { }
    public get GameData(): GameData {
        if (!this._gameData) {
            throw new Error(`${logName}: GameData not loaded yet`)
        }
        return this._gameData
    }

    public async load(): Promise<void> {
        this._gameData = await this.gameDataLoader.loadGameData()
        this.messageBus.postMessage({
            message: MESSAGE_ENGINE_GAME_DATA_LOADED,
            payload: this._gameData
        })
    }
}
