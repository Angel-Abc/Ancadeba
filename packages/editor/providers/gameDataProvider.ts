import { BaseItem, LanguageItem, LanguagesItem, PageItem, PagesItem, RootItem, TranslationsItem } from '@editor/types/gameItems'
import { Token, token } from '@ioc/token'
import { Game } from '@loader/schema/game'
import { ILogger, loggerToken } from '@utils/logger'

export interface IGameDataProvider {
    setGame(game: Game): void
    get Root(): RootItem
}

const logName = 'GameDataProvider'
export const gameDataProviderToken = token<IGameDataProvider>(logName)
export const gameDataProviderDependencies: Token<unknown>[] = [
    loggerToken
]
export class GameDataProvider implements IGameDataProvider {
    private nextId: number = 1
    private root: RootItem | null = null

    constructor(
        private logger: ILogger
    ) { }

    public setGame(game: Game): void {
        this.root = {
            type: 'root',
            id: this.nextId++,
            game: game,
            label: game.title,
            children: []
        }
        this.addPages()
        this.addLanguages()
        this.sortRoot()
    }

    public get Root(): RootItem {
        if (this.root) return this.root
        throw new Error(this.logger.error(logName, 'No game was set to create a root'))
    }

    private sortRoot(): void {
        this.sortItem(this.Root)
    }

    private sortItem(item: BaseItem): void {
        item.children.forEach(i => this.sortItem(i))
        item.children.sort((a,b) => a.label.localeCompare(b.label))
    }

    private addPages(): void {
        const root = this.Root
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
        const root = this.Root
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
