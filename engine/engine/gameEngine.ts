import { Token, token } from '@ioc/token'
import { gameLoaderToken, IGameLoader } from '@loader/gameLoader'
import { logDebug } from '@utils/logMessage'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { domManagerToken, IDomManager } from '../managers/domManager'
import { START_GAME_ENGINE_MESSAGE } from '../messages/system'
import { ILanguageManager, languageManagerToken } from '../managers/languageManager'

const logName: string = 'GameEngine'

export interface IGameEngine {
    start(): Promise<void>
}
export const gameEngineToken = token<IGameEngine>('GameEngine')
export const gameEngineDependencies: Token<unknown>[] = [messageBusToken, gameLoaderToken, domManagerToken, languageManagerToken]
export class GameEngine implements IGameEngine {
    constructor(
        private messageBus: IMessageBus, 
        private gameLoader: IGameLoader,
        private domManager: IDomManager,
        private languageManager: ILanguageManager
    ) {
    }

    async start(): Promise<void> {
        logDebug(logName, 'Starting game engine...')
        const game = await this.gameLoader.loadGame()
        logDebug(logName, 'Game loaded with data {0}', game)
        game.cssFiles.forEach((cssFile: string) => {
            this.domManager.setCssFile(cssFile)
            logDebug(logName, 'CSS file {0} set', cssFile)
        })
        this.languageManager.setLanguage(game.initialData.language)
        this.messageBus.postMessage({
            message: START_GAME_ENGINE_MESSAGE,
            payload: null
        })
    }
}
