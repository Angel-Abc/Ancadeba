import { Token, token } from '@angelabc/utils/ioc'
import { Game, gameSchema } from '@angelabc/schemas/schemas'
import { ILogger, loggerToken, loadJsonResource } from '@angelabc/utils/utils'

export interface IGameLoader {
    loadGameData(): Promise<void>
}

const logName = 'GameLoader'
export const gameLoaderToken = token<IGameLoader>(logName)
export const gameLoaderDependencies: Token<unknown>[] = [
    loggerToken
]
export class GameLoader implements IGameLoader {
    constructor(
        private logger: ILogger
    ) { }

    public async loadGameData(): Promise<void> {
        const gameMetaData = await loadJsonResource<Game>('/data/game.json', gameSchema, this.logger)
        this.logger.debug(logName, 'Loaded game meta data {0}', gameMetaData)
    }
}