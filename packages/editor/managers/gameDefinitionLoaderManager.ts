import { Token, token } from '@ioc/token'
import { Game, gameSchema } from '@loader/schema/game'
import { loadJsonResource } from '@utils/loadJsonResource'
import { ILogger, loggerToken } from '@utils/logger'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { CleanUp } from '@utils/types'
import { GAME_DEFINITION_UPDATED, INITIALIZED } from '../messages/editor'

export interface IGameDefinitionLoaderManager {
    initialize(): void
    cleanup(): void
}

const logName = 'GameDefinitionLoaderManager'
export const gameDefinitionLoaderManagerToken = token<IGameDefinitionLoaderManager>(logName)
export const dataUrlToken = token<string>('dataUrl')
export const gameDefinitionLoaderManagerDependencies: Token<unknown>[] = [
    loggerToken,
    messageBusToken,
    dataUrlToken
]
export class GameDefinitionLoaderManager implements IGameDefinitionLoaderManager {
    private cleanupFn: CleanUp | null = null
    constructor(
        private logger: ILogger,
        private messageBus: IMessageBus,
        private dataUrl: string
    ){}

    public cleanup(): void {
        const fn = this.cleanupFn
        this.cleanupFn = null
        fn?.()
    }

    public initialize(): void {
        this.cleanup()
        this.cleanupFn = this.messageBus.registerMessageListener(
            INITIALIZED,
            async () => await this.onInitialized()
        )       
    }

    private async onInitialized(): Promise<void> {
        const game = await loadJsonResource<Game>(`${this.dataUrl}/index.json`, gameSchema, this.logger)
        this.logger.debug(logName, 'loaded game root data {0}', game)
        this.messageBus.postMessage({
            message: GAME_DEFINITION_UPDATED,
            payload: null
        })
    }
}
