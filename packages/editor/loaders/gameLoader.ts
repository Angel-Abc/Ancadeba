import { dataUrlToken } from '@editor/builders/containerBuilders/staticDataTokens'
import { gameModelToken, IGameModelSet } from '@editor/model/GameModel'
import { Token, token } from '@ioc/token'
import { Game, gameSchema } from '@loader/schema/game'
import { loadJsonResource } from '@utils/loadJsonResource'
import { ILogger, loggerToken } from '@utils/logger'

export interface IGameLoader {
    load(): Promise<void>
}

const logName = 'GameLoader'
export const gameLoaderToken = token<IGameLoader>(logName)
export const gameLoaderDependencies: Token<unknown>[] = [
    dataUrlToken,
    loggerToken,
    gameModelToken
]
export class GameLoader implements IGameLoader {
    constructor(
        private dataUrl: string,
        private logger: ILogger,
        private gameModel: IGameModelSet
    ){}

    public async load(): Promise<void> {
        const path = `${this.dataUrl}/index.json`
        const game = await loadJsonResource<Game>(path, gameSchema, this.logger)
        this.gameModel.game = game
    }
}
