import { Token, token } from '@angelabc/utils/ioc'
import { Game, gameSchema } from '@angelabc/schemas/schemas'
import { ILogger, loggerToken, loadJsonResource } from '@angelabc/utils/utils'

export interface IJsonDataLoader {
    loadJsonData(): Promise<JsonData>
}

export type JsonData = {
    meta: Game
}

const logName = 'JsonDataLoader'
export const jsonDataLoaderToken = token<IJsonDataLoader>(logName)
export const jsonDataLoaderDependencies: Token<unknown>[] = [
    loggerToken
]
export class JsonDataLoader implements IJsonDataLoader {
    constructor(
        private logger: ILogger
    ) { }

    public async loadJsonData(): Promise<JsonData> {
        const result = {
            meta: await loadJsonResource<Game>('/data/game.json', gameSchema, this.logger)
        }
        this.logger.debug(logName, 'Loaded game data {0}', result)
        return result
    }
}