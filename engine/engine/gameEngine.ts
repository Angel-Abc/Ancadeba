import { Token, token } from '@ioc/token'
import { gameLoaderToken, IGameLoader } from '@loader/gameLoader'
import { logDebug } from '@utils/logMessage'
import { IMessageBus, messageBusToken } from '@utils/messageBus'

const LogName: string = 'GameEngine'

export interface IGameEngine {
    start(): Promise<void>
}
export const gameEngineToken = token<IGameEngine>('GameEngine')
export const gameEngineDependencies: Token<unknown>[] = [messageBusToken, gameLoaderToken]
export class GameEngine implements IGameEngine {
    private messageBus: IMessageBus
    private gameLoader: IGameLoader

    constructor(messageBus: IMessageBus, gameLoader: IGameLoader) {
        this.messageBus = messageBus
        this.gameLoader = gameLoader
    }

    async start(): Promise<void> {
        logDebug(LogName, 'Starting game engine...')
        const game = await this.gameLoader.loadGame()
        logDebug(LogName, 'Game loaded with data {0}', game)
        this.messageBus.postMessage({
            message: 'TEST',
            payload: { game }
        })
    }
}
