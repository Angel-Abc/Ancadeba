import { Token, token } from '@ioc/token'
import { Game, InitialData } from '@loader/data/game'
import { Language } from '@loader/data/language'
import { Page } from '@loader/data/page'
import { fatalError } from '@utils/logMessage'

export type GameData = {
    game: Game,
    loadedLanguages: Record<string, Language>,
    loadedPages: Record<string, Page>
}

export type GameContext = InitialData & {
    currentPageId: string | null
}

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
