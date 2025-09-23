import { Token, token } from '@angelabc/utils/ioc'
import { ILogger, loggerToken } from '@angelabc/utils/utils'
import { IMessageBus, messageBusToken } from '@angelabc/utils/utils/messageBus'
import { MESSAGE_ENGINE_START } from './messages'
import { gameStateProviderToken, IGameStateProvider } from './gameState'

export interface IGameEngine {
    start(): Promise<void>
}

const logName: string = 'GameEngine'
export const gameEngineToken = token<IGameEngine>(logName)
export const gameEngineDependencies: Token<unknown>[] = [
    loggerToken,
    messageBusToken,
    gameStateProviderToken
]

export class GameEngine implements IGameEngine {
    constructor(
        private logger: ILogger,
        private messageBus: IMessageBus,
        private gameStateProvider: IGameStateProvider
    ) { }

    public async start(): Promise<void> {
        this.logger.debug(logName, 'Starting game engine')
        this.messageBus.postMessage({
            message: MESSAGE_ENGINE_START,
            payload: {}
        })
    }
}