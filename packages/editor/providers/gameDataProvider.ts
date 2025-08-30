import { BaseItem, BaseItemType, LanguageItem, LanguagesItem, PageItem, PagesItem, RootItem, TranslationsItem } from '@editor/types/gameItems'
import { Token, token } from '@ioc/token'
import { Game } from '@loader/schema/game'
import { ILogger, loggerToken } from '@utils/logger'
import { gameDataStoreProviderToken, IGameDataStoreProvider, rootPath } from './gameDataStoreProvider'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { SET_EDITOR_CONTENT } from '@editor/messages/editor'
import { SetEditorContentPayload } from '@editor/messages/types'

export interface IGameDataProvider {
    setGame(game: Game): void
    get root(): RootItem
}

const logName = 'GameDataProvider'
export const gameDataProviderToken = token<IGameDataProvider>(logName)
export const gameDataProviderDependencies: Token<unknown>[] = [
    loggerToken,
    messageBusToken,
    gameDataStoreProviderToken
]
export class GameDataProvider implements IGameDataProvider {
    private nextId: number = 1
    private _root: RootItem | null = null

    constructor(
        private logger: ILogger,
        private messageBus: IMessageBus,
        private gameDataStoreProvider: IGameDataStoreProvider
    ) { }

    public setGame(game: Game): void {
        const root: RootItem = {
            type: 'root',
            id: this.nextId++,
            game: game,
            label: game.title,
            children: []
        }
        this._root = root
        this.addPages()
        this.addLanguages()
        this.sortRoot()
        this.gameDataStoreProvider.store(root.id, game, rootPath)
        const payload: SetEditorContentPayload = {
            id: root.id,
            label: root.label,
            type: root.type as BaseItemType
        }
        this.messageBus.postMessage({
            message: SET_EDITOR_CONTENT,
            payload: payload
        })
    }

    public get root(): RootItem {
        if (this._root) return this._root
        throw new Error(this.logger.error(logName, 'No game was set to create a root'))
    }

    private sortRoot(): void {
        this.sortItem(this.root)
    }

    private sortItem(item: BaseItem): void {
        item.children.forEach(i => this.sortItem(i))
        item.children.sort((a,b) => a.label.localeCompare(b.label))
    }

    private addPages(): void {
        const root = this.root
        const pagesItem: PagesItem = {
            type: 'pages',
            id: this.nextId++,
            label: 'Pages',
            children: []
        }
        for (const key of Object.keys(root.game.pages)) {
            const path = root.game.pages[key]
            const pageItem: PageItem = {
                type: 'page',
                id: this.nextId++,
                label: key,
                key: key,
                path: path,
                children: []
            }
            pagesItem.children.push(pageItem)
        }
        root.children.push(pagesItem)
    }

    private addLanguages(): void {
        const root = this.root
        const languagesItem: LanguagesItem = {
            type: 'languages',
            id: this.nextId++,
            label: 'Languages',
            children: []
        }
        for (const key of Object.keys(root.game.languages)) {
            const languageItem: LanguageItem = {
                type: 'language',
                id: this.nextId++,
                language: key,
                label: key,
                children: []
            }
            const language = root.game.languages[key]
            language.forEach(
                translations => {
                    const translationsItem: TranslationsItem = {
                        type: 'translations',
                        id: this.nextId++,
                        label: translations,
                        path: translations,
                        children: []
                    }
                    languageItem.children.push(translationsItem)
                }
            )
            languagesItem.children.push(languageItem)
        }
        root.children.push(languagesItem)
    }
}
