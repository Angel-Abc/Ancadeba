import { Token, token } from '@ioc/token'
import { gameDataProviderToken, IGameDataProvider } from '../providers/gameDataProvider'
import { fatalError } from '@utils/logMessage'
import { IPageLoader, pageLoaderToken } from '@loader/pageLoader'

interface IPageManager {
    setActivePage(pageId: string): Promise<void>
}

const logName = 'PageManager'
export const pageManagerToken = token<IPageManager>(logName)
export const pageManagerDependencies: Token<unknown>[] = [gameDataProviderToken, pageLoaderToken]
export class PageManager implements IPageManager {
    constructor(private gameDataProvider: IGameDataProvider, private pageLoader: IPageLoader) {}

    public async setActivePage(pageId: string): Promise<void> {
        const path = this.gameDataProvider.Game.game.pages[pageId]
        if (!path) fatalError(logName, 'Page not found for id {0}', pageId)
        
        if (this.gameDataProvider.Game.loadedPages[pageId] === undefined) {
            const page = await this.pageLoader.loadPage(path)
            this.gameDataProvider.Game.loadedPages[pageId] = page
        }

        this.gameDataProvider.Context.currentPageId = pageId
    }
}
