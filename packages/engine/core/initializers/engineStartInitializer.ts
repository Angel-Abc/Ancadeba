import { Token, token } from '@ioc/token'
import { InitialData } from '@loader/data/game'
import { ILanguageManager, languageManagerToken } from '@managers/languageManager'
import { START_GAME_ENGINE_MESSAGE, SWITCH_PAGE } from '@messages/system'
import { IMessageBus, messageBusToken } from '@utils/messageBus'

/**
 * Handles the final steps to start the engine once all subsystems are ready.
 */
export interface IEngineStartInitializer {
    /**
     * Configure runtime settings and notify the system to begin execution.
     *
     * @param initialData The initial configuration extracted from the game file.
     */
    initialize(initialData: InitialData): Promise<void>
}

const logName = 'EngineStartInitializer'
export const engineStartInitializerToken = token<IEngineStartInitializer>(logName)
export const engineStartInitializerDependencies: Token<unknown>[] = [
    messageBusToken,
    languageManagerToken
]
/**
 * Sets up initial language and dispatches messages to start the game engine.
 * Posting messages has the side effect of triggering listeners subscribed
 * to engine start and page switch events.
 */
export class EngineStartInitializer implements IEngineStartInitializer {
    /**
     * @param messageBus Bus used to broadcast engine lifecycle messages.
     * @param languageManager Manages the current language of the game.
     */
    constructor(
        private messageBus: IMessageBus,
        private languageManager: ILanguageManager
    ){}

    /**
     * Sets the configured language and notifies the system to start and
     * display the initial page.
     *
     * @param initialData Contains the language and start page for the game.
     */
    public async initialize(initialData: InitialData): Promise<void> {
        await this.languageManager.setLanguage(initialData.language)
        this.messageBus.postMessage({
            message: START_GAME_ENGINE_MESSAGE,
            payload: null
        })
        this.messageBus.postMessage({
            message: SWITCH_PAGE,
            payload: initialData.startPage
        })
    }
}
