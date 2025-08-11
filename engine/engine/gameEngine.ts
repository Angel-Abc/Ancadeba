import { Token, token } from '@ioc/token'
import { gameLoaderToken, IGameLoader } from '@loader/gameLoader'
import { logDebug } from '@utils/logMessage'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { domManagerToken, IDomManager } from '../managers/domManager'

const LogName: string = 'GameEngine'

export interface IGameEngine {
    start(): Promise<void>
}
export const gameEngineToken = token<IGameEngine>('GameEngine')
export const gameEngineDependencies: Token<unknown>[] = [messageBusToken, gameLoaderToken, domManagerToken]
export class GameEngine implements IGameEngine {
    constructor(
        private messageBus: IMessageBus, 
        private gameLoader: IGameLoader,
        private domManager: IDomManager
    ) {
    }

    async start(): Promise<void> {
        logDebug(LogName, 'Starting game engine...')
        const game = await this.gameLoader.loadGame()
        logDebug(LogName, 'Game loaded with data {0}', game)
        game.cssFiles.forEach((cssFile: string) => {
            this.domManager.setCssFile(cssFile)
            logDebug(LogName, 'CSS file {0} set', cssFile)
        })
        this.messageBus.postMessage({
            message: 'TEST',
            payload: { game }
        })
    }
}
