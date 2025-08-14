import { Token, token } from '@ioc/token'
import { gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'
import { fatalError } from '@utils/logMessage'
import { IPageLoader, pageLoaderToken } from '@loader/pageLoader'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { CleanUp } from '@utils/types'
import { PAGE_SWITCHED, SWITCH_PAGE } from '@messages/system'

export interface IPageManager {
    setActivePage(pageId: string): Promise<void>
    cleanup(): void
}

const logName = 'PageManager'
export const pageManagerToken = token<IPageManager>(logName)
export const pageManagerDependencies: Token<unknown>[] = [gameDataProviderToken, pageLoaderToken, messageBusToken]
export class PageManager implements IPageManager {
    private cleanupFn: CleanUp | null

    constructor(
        private gameDataProvider: IGameDataProvider, 
        private pageLoader: IPageLoader, 
        private messageBus: IMessageBus
    ) {
        this.cleanupFn = this.messageBus.registerMessageListener(
            SWITCH_PAGE,
            async message => {
                await this.setActivePage(message.payload as string)
            }
        )
    }

    public cleanup(): void {
        this.cleanupFn?.()
        this.cleanupFn = null
    }

    public async setActivePage(pageId: string): Promise<void> {
        const path = this.gameDataProvider.Game.game.pages[pageId]
        if (!path) fatalError(logName, 'Page not found for id {0}', pageId)
        
        if (this.gameDataProvider.Game.loadedPages[pageId] === undefined) {
            const page = await this.pageLoader.loadPage(path)
            this.gameDataProvider.Game.loadedPages[pageId] = page
        }

        this.gameDataProvider.Context.currentPageId = pageId

        this.messageBus.postMessage({
            message: PAGE_SWITCHED,
            payload: pageId
        })
    }
}
