import { Token, token } from '@angelabc/utils/ioc'
import { ILogger, loggerToken } from '@angelabc/utils/utils'

export interface IGameEngine {
    start(): Promise<void>
}

const logName: string = 'GameEngine'
export const gameEngineToken = token<IGameEngine>(logName)
export const gameEngineDependencies: Token<unknown>[] = [loggerToken]

export class GameEngine implements IGameEngine {
    constructor(
        private logger: ILogger
    ) { }

    public async start(): Promise<void> {
        this.logger.debug(logName, 'Starting game engine')
    }
}