import { Token, token } from '@angelabc/utils/ioc'
import { ILogger, loggerToken, IMessageBus, messageBusToken } from '@angelabc/utils/utils'
import { MESSAGE_ENGINE_LOADING, MESSAGE_ENGINE_START } from './messages'
import { engineInitializerToken, IEngineInitializer } from './initializers/engineInitializer'
import { gameDataProviderToken, IGameDataProviderInternal } from '../providers/gameDataProvider'

export interface IGameEngine {
    start(): Promise<void>
}

const logName: string = 'GameEngine'
export const gameEngineToken = token<IGameEngine>(logName)
export const gameEngineDependencies: Token<unknown>[] = [
    loggerToken,
    messageBusToken,
    engineInitializerToken,
    gameDataProviderToken
]

export class GameEngine implements IGameEngine {
    constructor(
        private logger: ILogger,
        private messageBus: IMessageBus,
        private engineInitializer: IEngineInitializer,
        private gameDataProvider: IGameDataProviderInternal
    ) { }

    public async start(): Promise<void> {
        this.logger.debug(logName, 'Starting game engine')
        await this.engineInitializer.initialize()
        this.messageBus.postMessage({
            message: MESSAGE_ENGINE_LOADING,
            payload: null
        })
        await this.gameDataProvider.load()
        this.messageBus.postMessage({
            message: MESSAGE_ENGINE_START,
            payload: null
        })
    }
}