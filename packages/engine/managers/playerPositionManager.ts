import { Token, token } from '@ioc/token'
import { Position } from '@loader/data/map'
import { CHANGE_POSITION, CHANGING_POSITION, POSITION_CHANGED } from '@messages/system'
import { gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { CleanUp } from '@utils/types'

/**
 * Manages player position updates.
 */
export interface IPlayerPositionManager {
    changePosition(position: Position): void
    initialize(): void
    cleanup(): void
}

const logName = 'PlayerPositionManager'
export const playerPositionManagerToken = token<IPlayerPositionManager>(logName)
export const playerPositionManagerDependencies: Token<unknown>[] = [
    gameDataProviderToken,
    messageBusToken
]

/**
 * Default implementation of {@link IPlayerPositionManager}.
 */
export class PlayerPositionManager implements IPlayerPositionManager {
    private cleanupFn: CleanUp | null = null

    constructor(
        private gameDataProvider: IGameDataProvider,
        private messageBus: IMessageBus
    ) { }

    public initialize() {
        this.cleanup()
        this.cleanupFn = this.messageBus.registerMessageListener(
            CHANGE_POSITION,
            message => {
                this.changePosition(message.payload as Position)
            }
        )
    }

    public cleanup(): void {
        const fn = this.cleanupFn
        this.cleanupFn = null
        fn?.()
    }

    /**
     * Updates the player's position within the current map.
     *
     * @param position - New coordinates for the player.
     * @remarks Side effects: mutates the player's position in the game data
     * provider's context.
     */
    public changePosition(position: Position): void {
        this.messageBus.postMessage({
            message: CHANGING_POSITION,
            payload: this.gameDataProvider.context.player.position
        })
        this.gameDataProvider.context.player.position = position
        this.messageBus.postMessage({
            message: POSITION_CHANGED,
            payload: position
        })
    }
}

