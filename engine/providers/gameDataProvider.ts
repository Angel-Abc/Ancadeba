import { Token, token } from '@ioc/token'
import { Game, InitialData } from '@loader/data/game'
import { Input, VirtualInput, VirtualKey } from '@loader/data/inputs'
import { Language } from '@loader/data/language'
import { GameMap, Position } from '@loader/data/map'
import { Page } from '@loader/data/page'
import { Tile } from '@loader/data/tile'
import type { ILogger } from '@utils/logger'
import { loggerToken } from '@utils/logger'

export type ActiveInput = {
    input: Input,
    enabled: boolean,
    visible: boolean
}

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
    loadedPages: Record<string, Page>,
    loadedMaps: Record<string, GameMap>,
    loadedTiles: Map<string, Tile>,
    loadedTileSets: Set<string>,
    loadedVirtualKeys: Map<string, VirtualKey>,
    loadedVirtualInputs: Map<string, VirtualInput>,
    activeInputs: Map<string, ActiveInput>
}

/**
 * Contextual information for the running game.
 * Extends {@link InitialData} and tracks the current page.
 *
 * @property currentPageId - Identifier of the current page or `null` when none is active.
 */
export type GameContext = InitialData & {
    currentPageId: string | null
    currentMap: {
        id: string | null,
        width: number,
        height: number
    },
    isInmodalDialog: boolean,
    player: {
        position: Position
    }
}

/**
 * Provides access to the game data and contextual information.
 */
export interface IGameDataProvider {
    /**
     * Retrieves the loaded game data.
     *
     * @throws Error If {@link initialize} has not been invoked.
     */
    get Game(): GameData
    /**
     * Retrieves the current game context.
     *
     * @throws Error If {@link initialize} has not been invoked.
     */
    get Context(): GameContext
    initialize(gameData: Game): void
}

const logName = 'GameDataProvider'
export const gameDataProviderToken = token<IGameDataProvider>(logName)
export const gameDataProviderDependencies: Token<unknown>[] = [loggerToken]
export class GameDataProvider implements IGameDataProvider {
    private game: GameData | null = null
    private context: GameContext | null = null

    constructor(private logger: ILogger) {}

    /**
     * Returns the loaded game data.
     *
     * @remarks {@link initialize} must be called before accessing this getter.
     * @throws Error If the provider has not been initialized.
     */
    public get Game(): GameData {
        if (!this.game) {
            const message = this.logger.error(logName, 'Game data not loaded')
            throw new Error(message)
        }
        return this.game
    }

    /**
     * Returns the current game context.
     *
     * @remarks {@link initialize} must be called before accessing this getter.
     * @throws Error If the provider has not been initialized.
     */
    public get Context(): GameContext {
        if (!this.context) {
            const message = this.logger.error(logName, 'Game context not loaded')
            throw new Error(message)
        }
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
        if (this.game) {
            const message = this.logger.error(logName, 'Game data already initialized')
            throw new Error(message)
        }
        this.game = {
            game: gameData,
            loadedLanguages: {},
            loadedPages: {},
            loadedMaps: {},
            loadedTiles: new Map<string, Tile>(),
            loadedTileSets: new Set<string>(),
            loadedVirtualKeys: new Map<string, VirtualKey>(),
            loadedVirtualInputs: new Map<string, VirtualInput>(),
            activeInputs: new Map<string, ActiveInput>()
        }
        this.context = { 
            ...gameData.initialData,
            currentPageId: null,
            currentMap: {
                id: null,
                width: 0,
                height: 0
            },
            isInmodalDialog: false,
            player: {
                position: {
                    x: 0,
                    y: 0
                }
            }
        }
    }
}
