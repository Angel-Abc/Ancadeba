import { Token, token } from '@ioc/token'
import { Position } from '@loader/data/map'
import { gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'

/**
 * Manages player position updates.
 */
export interface IPlayerPositionManager {
    changePosition(position: Position): void
}

const logName = 'PlayerPositionManager'
export const playerPositionManagerToken = token<IPlayerPositionManager>(logName)
export const playerPositionManagerDependencies: Token<unknown>[] = [
    gameDataProviderToken
]

/**
 * Default implementation of {@link IPlayerPositionManager}.
 */
export class PlayerPositionManager implements IPlayerPositionManager {
    constructor(
        private gameDataProvider: IGameDataProvider
    ) {}

    /**
     * Updates the player's position within the current map.
     *
     * @param position - New coordinates for the player.
     * @remarks Side effects: mutates the player's position in the game data
     * provider's context.
     */
    public changePosition(position: Position): void {
        this.gameDataProvider.Context.player.position = position
    }
}

