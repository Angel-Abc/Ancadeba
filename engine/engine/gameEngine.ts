import { Token, token } from '@ioc/token'
import { gameLoaderToken, IGameLoader } from '@loader/gameLoader'
import { fatalError, logDebug } from '@utils/logMessage'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { domManagerToken, IDomManager } from '../managers/domManager'
import { START_GAME_ENGINE_MESSAGE } from '../messages/system'
import { ILanguageManager, languageManagerToken } from '../managers/languageManager'
import { gameDataProviderToken, IGameDataProvider } from '../providers/gameDataProvider'

const logName: string = 'GameEngine'

export interface IGameEngine {
    start(): Promise<void>
}
export const gameEngineToken = token<IGameEngine>('GameEngine')
export const gameEngineDependencies: Token<unknown>[] = [messageBusToken, gameLoaderToken, domManagerToken, languageManagerToken, gameDataProviderToken]
export class GameEngine implements IGameEngine {
    constructor(
        private messageBus: IMessageBus, 
        private gameLoader: IGameLoader,
        private domManager: IDomManager,
        private languageManager: ILanguageManager,
        private gameDataProvider: IGameDataProvider
    ) {
    }

    async start(): Promise<void> {
        logDebug(logName, 'Starting game engine...')
        const game = await this.gameLoader.loadGame()
        if (!game) fatalError(logName, 'Game data is null or undefined')
        logDebug(logName, 'Game loaded with data {0}', game)
        this.domManager.setTitle(game.title)
        this.gameDataProvider.initialize(game)
        game.cssFiles.forEach((cssFile: string) => {
            this.domManager.setCssFile(cssFile)
            logDebug(logName, 'CSS file {0} set', cssFile)
        })
        await this.languageManager.setLanguage(game.initialData.language)
        this.messageBus.postMessage({
            message: START_GAME_ENGINE_MESSAGE,
            payload: null
        })
    }
}
