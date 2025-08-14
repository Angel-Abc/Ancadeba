import { Token, token } from '@ioc/token'
import { Game, InitialData } from '@loader/data/game'
import { Language } from '@loader/data/language'
import { Page } from '@loader/data/page'
import { fatalError } from '@utils/logMessage'

/**
 * Runtime representation of the game state.
 *
 * @property game - The static game definition.
 * @property loadedLanguages - Map of languages loaded during execution, keyed by language id.
 * @property loadedPages - Map of pages loaded during execution, keyed by page id.
 */
export type GameData = {
    game: Game,
    loadedLanguages: Record<string, Language>,
    loadedPages: Record<string, Page>
}

/**
 * Contextual information for the running game.
 * Extends {@link InitialData} and tracks the current page.
 *
 * @property currentPageId - Identifier of the current page or `null` when none is active.
 */
export type GameContext = InitialData & {
    currentPageId: string | null
}

/**
 * Provides access to the game data and contextual information.
 */
export interface IGameDataProvider {
    get Game(): GameData
    get Context(): GameContext
    initialize(gameData: Game): void
}

const logName = 'GameDataProvider'
export const gameDataProviderToken = token<IGameDataProvider>(logName)
export const gameDataProviderDependencies: Token<unknown>[] = []
export class GameDataProvider implements IGameDataProvider {
    private game: GameData | null = null
    private context: GameContext | null = null

    public get Game(): GameData { 
        if (!this.game) fatalError(logName, 'Game data not loaded')
        return this.game 
    }

    public get Context(): GameContext {
        if (!this.context) fatalError(logName, 'Game context not loaded')
        return this.context
    }

    /**
     * Initializes the provider with the supplied game data.
     *
     * @param gameData - The static game definition to load.
     * @throws If the provider has already been initialized.
     *
     * @remarks
     * Preconditions: `initialize` must be called exactly once before accessing {@link Game} or {@link Context}.
     * Effects:
     * - Populates the internal `game` store with the provided game and empty caches for languages and pages.
     * - Sets `context` to the game's initial data with `currentPageId` reset to `null`.
     */
    public initialize(gameData: Game): void {
        if (this.game) fatalError(logName, 'Game data already initialized')
        this.game = {
            game: gameData,
            loadedLanguages: {},
            loadedPages: {}
        }
        this.context = { 
            ...gameData.initialData,
            currentPageId: null 
        }
    }
}
