import { Token, token } from '@ioc/token'
import { InitialData } from '@loader/data/game'
import { ILanguageManager, languageManagerToken } from '@managers/languageManager'
import { START_GAME_ENGINE_MESSAGE, SWITCH_PAGE } from '@messages/system'
import { IMessageBus, messageBusToken } from '@utils/messageBus'

export interface IEngineStartInitializer {
    initialize(initialData: InitialData): Promise<void>
}

const logName = 'EngineStartInitializer'
export const engineStartInitializerToken = token<IEngineStartInitializer>(logName)
export const engineStartInitializerDependencies: Token<unknown>[] = [
    messageBusToken,
    languageManagerToken
]
export class EngineStartInitializer implements IEngineStartInitializer {
    constructor(
        private messageBus: IMessageBus,
        private languageManager: ILanguageManager
    ){}

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
