import { Token, token } from '@angelabc/utils/ioc'
import { Game } from '@angelabc/schemas/schemas'
import { ILogger, loggerToken } from '@angelabc/utils/utils'
import { jsonDataLoaderToken, IJsonDataLoader } from '@angelabc/schemas/loaders'

export interface IGameDataProvider {
    get metaData(): Game
    load(): Promise<void>
}

const logName = 'GameDataProvider'
export const gameDataProviderToken = token<IGameDataProvider>(logName)
export const gameDataProviderDependencies: Token<unknown>[] = [
    loggerToken,
    jsonDataLoaderToken
]

export class GameDataProvider implements IGameDataProvider {
    private _metaData: Game | null = null

    constructor(
        private logger: ILogger,
        private jsonDataLoader: IJsonDataLoader
    ) {
    }

    public get metaData(): Game {
        if (!this._metaData) throw new Error(this.logger.error(logName, 'MetaData not loaded yet'))
        return this._metaData
    }

    public async load(): Promise<void> {
        const jsonData = await this.jsonDataLoader.loadJsonData()
        this._metaData = jsonData.meta
        this.logger.debug(logName, 'Loaded meta data {0}', this._metaData)
    }
}
