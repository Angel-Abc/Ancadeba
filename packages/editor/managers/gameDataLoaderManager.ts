import { Token, token } from '@ioc/token'
import { Game, gameSchema } from '@loader/schema/game'
import { loadJsonResource } from '@utils/loadJsonResource'
import { ILogger, loggerToken } from '@utils/logger'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { CleanUp } from '@utils/types'
import { GAME_DEFINITION_UPDATED, INITIALIZED } from '../messages/editor'
import { gameDataProviderToken, IGameDataProvider } from '@editor/providers/gameDataProvider'
import { rootPath } from '@editor/providers/gameDataStoreProvider'

export interface IGameDataLoaderManager {
    initialize(): void
    cleanup(): void
}

const logName = 'GameDataLoaderManager'
export const gameDataLoaderManagerToken = token<IGameDataLoaderManager>(logName)
export const dataUrlToken = token<string>('dataUrl')
export const gameDataLoaderManagerDependencies: Token<unknown>[] = [
    loggerToken,
    messageBusToken,
    dataUrlToken,
    gameDataProviderToken,
]
export class GameDataLoaderManager implements IGameDataLoaderManager {
    private cleanupFn: CleanUp | null = null
    constructor(
        private logger: ILogger,
        private messageBus: IMessageBus,
        private dataUrl: string,
        private gameDataProvider: IGameDataProvider,
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
        const path = `${this.dataUrl}/${rootPath}`
        let game: Game
        try {
            game = await loadJsonResource<Game>(path, gameSchema, this.logger)
        } catch (error) {
            this.logger.error(logName, 'Failed to load game definition from {0}: {1}', path, error)
            return
        }
        this.gameDataProvider.setGame(game)
        this.messageBus.postMessage({
            message: GAME_DEFINITION_UPDATED,
            payload: null
        })
    }
}
