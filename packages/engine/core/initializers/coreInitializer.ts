import { Token, token } from '@ioc/token'
import { Game } from '@loader/data/game'
import { domManagerToken, IDomManager } from '@managers/domManager'
import { ILogger, loggerToken } from '@utils/logger'

/**
 * Initializes core browser related services needed by the engine.
 */
export interface ICoreInitializer {
    /**
     * Prepare the runtime environment using information from the game data.
     *
     * @param game Parsed game metadata used to configure the DOM.
     */
    initialize(game: Game): void
}

const logName = 'CoreInitializer'
export const coreInitializerToken = token<ICoreInitializer>(logName)
export const coreInitializerDependencies: Token<unknown>[] = [
    loggerToken,
    domManagerToken
]
/**
 * Sets browser metadata such as page title and linked stylesheets
 * required by the game.
 */
export class CoreInitializer implements ICoreInitializer {
    /**
     * @param logger Used for debug output when applying styles.
     * @param domManager Manipulates the document object model.
     */
    constructor(
        private logger: ILogger,
        private domManager: IDomManager
    ){}

    /**
     * Applies game specific settings to the browser environment.
     *
     * @param game The game metadata defining title and CSS files.
     */
    public initialize(game: Game): void {
        this.setupBrowser(game)
    }

    /**
     * Updates the DOM title and injects CSS links for the game.
     *
     * @param game Game metadata used for DOM updates.
     */
    private setupBrowser(game: Game) {
        this.domManager.setTitle(game.title)
        game.cssFiles.forEach((cssFile: string) => {
            this.domManager.setCssFile(cssFile)
            this.logger.debug(logName, 'CSS file {0} set', cssFile)
        })
    }

}
