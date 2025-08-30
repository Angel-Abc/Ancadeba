import { Token, token } from '@ioc/token'
import { Game, gameSchema } from '@loader/schema/game'
import { ILogger, loggerToken } from '@utils/logger'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { CleanUp } from '@utils/types'
import { GAME_DEFINITION_UPDATED, INITIALIZED, SET_EDITOR_CONTENT } from '../messages/editor'
import { gameDataProviderToken, IGameDataProvider } from '@editor/providers/gameDataProvider'
import { gameDataStoreProviderToken, IGameDataStoreProvider, rootPath } from '@editor/providers/gameDataStoreProvider'
import { SetEditorContentPayload } from '@editor/messages/types'
import { Languages } from '@editor/types/storeItems'
import { gameJsonLoaderToken, IGameJsonLoader } from '@editor/loaders/gameJsonLoader'

export interface IGameDataLoaderManager {
    initialize(): void
    cleanup(): void
}

const logName = 'GameDataLoaderManager'
export const gameDataLoaderManagerToken = token<IGameDataLoaderManager>(logName)
export const gameDataLoaderManagerDependencies: Token<unknown>[] = [
    loggerToken,
    messageBusToken,
    gameDataProviderToken,
    gameDataStoreProviderToken,
    gameJsonLoaderToken
]
export class GameDataLoaderManager implements IGameDataLoaderManager {
    private cleanupFns: CleanUp[] = []
    constructor(
        private logger: ILogger,
        private messageBus: IMessageBus,
        private gameDataProvider: IGameDataProvider,
        private gameDataStoreProvider: IGameDataStoreProvider,
        private gameJsonLoader: IGameJsonLoader
    ) { }

    public cleanup(): void {
        const fns = this.cleanupFns
        this.cleanupFns = []
        fns.forEach(fn => fn())
    }

    public initialize(): void {
        this.cleanup()
        this.cleanupFns = [
            this.messageBus.registerMessageListener(
                INITIALIZED,
                async () => await this.loadGameDefinition()
            ),
            this.messageBus.registerMessageListener(
                SET_EDITOR_CONTENT,
                async message => await this.loadContent(message.payload as SetEditorContentPayload)
            )
        ]
    }

    private async loadContent(setEditorContent: SetEditorContentPayload): Promise<void> {
        if (this.gameDataStoreProvider.hasData(setEditorContent.id)) {
            // data is already loaded
            return
        }
        switch (setEditorContent.type) {
            case 'languages':
                {
                    const languages: Languages = Object.keys(this.gameDataProvider.root.game.languages).sort()
                    this.gameDataStoreProvider.store(setEditorContent.id, languages, '')
                    break
                }
            default: {
                const error = this.logger.error(logName, 'No loader for type {0}', setEditorContent.type)
                throw new Error(error)
            }
        }
    }

    private async loadGameDefinition(): Promise<void> {
        let game: Game
        try {
            game = await this.gameJsonLoader.loadJson<Game>(rootPath, gameSchema)
        } catch (error) {
            this.logger.error(logName, 'Failed to load game definition from {0}: {1}', rootPath, error)
            return
        }
        this.gameDataProvider.setGame(game)
        this.messageBus.postMessage({
            message: GAME_DEFINITION_UPDATED,
            payload: null
        })
    }
}
