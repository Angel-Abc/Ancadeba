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
import { gameJsonSaverToken, IGameJsonSaver } from '@editor/savers/gameJsonSaver'
import { BaseItemType, PageItem, TranslationsItem } from '@editor/types/gameItems'
import { languageSchema, Language } from '@loader/schema/language'
import { Page, pageSchema } from '@loader/schema/page'

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
    gameJsonLoaderToken,
    gameJsonSaverToken
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
        private gameJsonLoader: IGameJsonLoader,
        private gameJsonSaver: IGameJsonSaver
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
            case 'page':
                {
                    const item = this.gameDataProvider.getItemById(setEditorContent.id) as PageItem | null
                    if (!item || !('path' in item)) {
                        this.logger.error(logName, 'Unable to resolve page path for id {0}', setEditorContent.id)
                        return
                    }
                    const path = item.path
                    let data: Page
                    try {
                        data = await this.gameJsonLoader.loadJson<Page>(path, pageSchema)
                    } catch (error) {
                        // Page file missing or invalid; create a default one so editing can proceed
                        const defaultPage: Page = {
                            id: item.key,
                            screen: { type: 'grid', width: 12, height: 8, components: [] },
                            inputs: []
                        }
                        try {
                            await this.gameJsonSaver.saveJson<Page>(path, defaultPage, pageSchema)
                            data = defaultPage
                        } catch (err2) {
                            this.logger.error(logName, 'Failed to load page from {0}: {1}', path, error)
                            this.logger.error(logName, 'Also failed to create default page at {0}: {1}', path, err2)
                            return
                        }
                    }
                    this.gameDataStoreProvider.store(setEditorContent.id, data, path)
                    break
                }
            case 'translations':
                {
                    const item = this.gameDataProvider.getItemById(setEditorContent.id) as TranslationsItem | null
                    if (!item || !('path' in item)) {
                        this.logger.error(logName, 'Unable to resolve translations path for id {0}', setEditorContent.id)
                        return
                    }
                    const path = item.path
                    let data: Language
                    try {
                        data = await this.gameJsonLoader.loadJson<Language>(path, languageSchema)
                    } catch (error) {
                        this.logger.error(logName, 'Failed to load translations from {0}: {1}', path, error)
                        return
                    }
                    this.gameDataStoreProvider.store(setEditorContent.id, data, path)
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
