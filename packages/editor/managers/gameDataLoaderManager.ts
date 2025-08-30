import { Token, token } from '@ioc/token'
import { Game, gameSchema } from '@loader/schema/game'
import { ILogger, loggerToken } from '@utils/logger'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { CleanUp } from '@utils/types'
import { GAME_DEFINITION_UPDATED, INITIALIZED, SET_EDITOR_CONTENT } from '../messages/editor'
import { gameDataProviderToken, IGameDataProvider } from '@editor/providers/gameDataProvider'
import { gameDataStoreProviderToken, IGameDataStoreProvider, rootPath } from '@editor/providers/gameDataStoreProvider'
import { SetEditorContentPayload } from '@editor/messages/types'
import { Languages, Pages } from '@editor/types/storeItems'
import { gameJsonLoaderToken, IGameJsonLoader } from '@editor/loaders/gameJsonLoader'
import { BaseItemType } from '@editor/types/gameItems'

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

const validBaseItemTypes: BaseItemType[] = [
    'root',
    'pages',
    'page',
    'languages',
    'language',
    'translations'
]

function isSetEditorContentPayload(payload: unknown): payload is SetEditorContentPayload {
    if (typeof payload !== 'object' || payload === null) {
        return false
    }
    const { id, label, type } = payload as Record<string, unknown>
    return typeof id === 'number' &&
        typeof label === 'string' &&
        (type === null || (typeof type === 'string' && validBaseItemTypes.includes(type as BaseItemType)))
}

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
                async message => {
                    if (!isSetEditorContentPayload(message.payload)) {
                        this.logger.error(logName, 'Invalid payload for {0}', SET_EDITOR_CONTENT)
                        return
                    }
                    await this.loadContent(message.payload)
                }
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
            case 'pages':
                {
                    const pages: Pages = Object.keys(this.gameDataProvider.root.game.pages)
                        .sort()
                        .map(k => ({ key: k, path: this.gameDataProvider.root.game.pages[k] }))
                    this.gameDataStoreProvider.store(setEditorContent.id, pages, '')
                    break
                }
            default:
                this.logger.error(logName, 'No loader for type {0}', setEditorContent.type)
                return
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
