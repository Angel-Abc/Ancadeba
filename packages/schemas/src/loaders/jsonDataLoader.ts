import { Token, token } from '@angelabc/utils/ioc'
import { Game, gameSchema } from '@angelabc/schemas/schemas'
import { ILogger, loggerToken, loadJsonResource } from '@angelabc/utils/utils'

export interface IJsonDataLoader {
    loadJsonData(): Promise<JsonData>
}

export interface IJsonDataLoaderConfiguration {
    rootPath: string
}
export const jsonDataLoaderConfigurationToken = token<IJsonDataLoaderConfiguration>('JsonDataLoaderConfiguration')

export type JsonData = {
    meta: Game
}

const logName = 'JsonDataLoader'
export const jsonDataLoaderToken = token<IJsonDataLoader>(logName)
export const jsonDataLoaderDependencies: Token<unknown>[] = [
    loggerToken,
    jsonDataLoaderConfigurationToken
]
export class JsonDataLoader implements IJsonDataLoader {
    constructor(
        private logger: ILogger,
        private config: IJsonDataLoaderConfiguration
    ) { }

    public async loadJsonData(): Promise<JsonData> {
        const result = {
            meta: await loadJsonResource<Game>(`${this.config.rootPath}/game.json`, gameSchema, this.logger)
        }
        this.logger.debug(logName, 'Loaded game data {0}', result)
        return result
    }
}