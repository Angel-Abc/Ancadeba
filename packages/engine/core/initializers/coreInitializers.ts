import { Token, token } from '@ioc/token'
import { Game } from '@loader/data/game'
import { domManagerToken, IDomManager } from '@managers/domManager'
import { ILogger, loggerToken } from '@utils/logger'

export interface ICoreInitializer {
    initialize(game: Game): void
}

const logName = 'CoreInitializer'
export const coreInitializerToken = token<ICoreInitializer>(logName)
export const coreInitializerDependencies: Token<unknown>[] = [
    loggerToken,
    domManagerToken
]
export class CoreInitializer implements ICoreInitializer {
    constructor(
        private logger: ILogger,
        private domManager: IDomManager
    ){}

    public async initialize(game: Game): Promise<void> {
        this.setupBrowser(game)        
    }

    private setupBrowser(game: Game) {
        this.domManager.setTitle(game.title)
        game.cssFiles.forEach((cssFile: string) => {
            this.domManager.setCssFile(cssFile)
            this.logger.debug(logName, 'CSS file {0} set', cssFile)
        })
    }

}
