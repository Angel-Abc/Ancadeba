import { Token, token } from '@ioc/token'
import { gameLoaderToken, IGameLoader } from '@loader/gameLoader'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { domManagerToken, IDomManager } from '../managers/domManager'
import { ILanguageManager, languageManagerToken } from '../managers/languageManager'
import { gameDataProviderToken, IGameDataProvider } from '../providers/gameDataProvider'
import { Game } from '@loader/data/game'
import { fatalError, logDebug } from '@utils/logMessage'
import { START_GAME_ENGINE_MESSAGE, SWITCH_PAGE } from '../messages/system'
import { pageManagerToken, IPageManager } from '../managers/pageManager'

export interface IEngineInitializer {
    initialize(): Promise<void>
}

const logName = 'EngineInitializer'
export const engineInitializerToken = token<IEngineInitializer>(logName)
export const engineInitializerDependencies: Token<unknown>[] = [messageBusToken, gameLoaderToken, domManagerToken, languageManagerToken, gameDataProviderToken,pageManagerToken]
export class EngineInitializer implements IEngineInitializer {
    constructor(
        private messageBus: IMessageBus, 
        private gameLoader: IGameLoader,
        private domManager: IDomManager,
        private languageManager: ILanguageManager,
        private gameDataProvider: IGameDataProvider,
        private pageManager: IPageManager
    ){}

    public async initialize(): Promise<void> {
        const game = await this.loadGameDataRoot()
        this.gameDataProvider.initialize(game)
        await this.languageManager.setLanguage(game.initialData.language)
        this.setupBrowser(game)
        this.messageBus.postMessage({
            message: START_GAME_ENGINE_MESSAGE,
            payload: null
        })
        this.messageBus.postMessage({
            message: SWITCH_PAGE,
            payload: game.initialData.startPage
        })
    }

    private setupBrowser(game: Game) {
        this.domManager.setTitle(game.title)
        game.cssFiles.forEach((cssFile: string) => {
            this.domManager.setCssFile(cssFile)
            logDebug(logName, 'CSS file {0} set', cssFile)
        })
    }
    
    private async loadGameDataRoot(): Promise<Game> {
        const game = await this.gameLoader.loadGame()
        if (!game) fatalError(logName, 'Game data is null or undefined')
        logDebug(logName, 'Game loaded with data {0}', game)
        return game
    }
}
