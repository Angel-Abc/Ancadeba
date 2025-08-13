import { Token, token } from '@ioc/token'
import { engineInitializerToken, IEngineInitializer } from './engineInitializer'
import { logDebug } from '@utils/logMessage'


export interface IGameEngine {
    start(): Promise<void>
}

const logName: string = 'GameEngine'
export const gameEngineToken = token<IGameEngine>(logName)
export const gameEngineDependencies: Token<unknown>[] = [engineInitializerToken]
export class GameEngine implements IGameEngine {
    constructor(
        private engineInitializer: IEngineInitializer
    ) {
    }

    async start(): Promise<void> {
        logDebug(logName, 'Starting game engine...')
        await this.engineInitializer.initialize()
    }
}
