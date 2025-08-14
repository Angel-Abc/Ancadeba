/**
 * Handles loading and switching between game pages while keeping the current
 * page state synchronized with the message bus and game data provider.
 */
import { Token, token } from '@ioc/token'
import { gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'
import { fatalError } from '@utils/logMessage'
import { IPageLoader, pageLoaderToken } from '@loader/pageLoader'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { CleanUp } from '@utils/types'
import { PAGE_SWITCHED, SWITCH_PAGE } from '@messages/system'

/**
 * Contract for managing the current page of the game.
 */
export interface IPageManager {
    /**
     * Loads and activates the page associated with the given identifier.
     *
     * @param pageId - Unique page identifier.
     */
    setActivePage(pageId: string): Promise<void>

    initialize(): void

    /**
     * Removes listeners and releases resources held by the manager.
     */
    cleanup(): void
}

const logName = 'PageManager'
export const pageManagerToken = token<IPageManager>(logName)
export const pageManagerDependencies: Token<unknown>[] = [gameDataProviderToken, pageLoaderToken, messageBusToken]
/**
 * Default implementation of {@link IPageManager} that integrates with the
 * game's data provider and message bus to control page transitions.
 */
export class PageManager implements IPageManager {
    private cleanupFn: CleanUp | null = null

    /**
     * Creates a new {@link PageManager}.
     *
     * @param gameDataProvider - Provides access to game data and context.
     * @param pageLoader - Loader used to fetch page definitions as needed.
     * @param messageBus - Message bus used to listen for and emit page switch
     * events.
     */
    constructor(
        private gameDataProvider: IGameDataProvider,
        private pageLoader: IPageLoader,
        private messageBus: IMessageBus
    ) {
    }

    initialize(): void {
        // Ensure we don't register multiple listeners if initialize is called more than once
        this.cleanupFn?.()
        this.cleanupFn = this.messageBus.registerMessageListener(
            SWITCH_PAGE,
            async message => {
                await this.setActivePage(message.payload as string)
            }
        )
    }

    /**
     * Releases resources and unregisters any message listeners.
     */
    public cleanup(): void {
        this.cleanupFn?.()
        this.cleanupFn = null
    }

    /**
     * Loads the specified page and marks it as the active page. If the page has
     * not been previously loaded it will be retrieved using the configured
     * page loader.
     *
     * @param pageId - Identifier of the page to activate.
     * @throws If no page is defined for the given id.
     */
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
